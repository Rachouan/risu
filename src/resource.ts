/**
 * Represents an asynchronous action that operates within a given context.
 *
 * @template Context - The type of the context provided to the action.
 * @template Input - The type of the input arguments to the action.
 * @template Output - The type of the output returned by the action.
 */
type Action<Context, Input extends any[], Output> = (
  context: Context,
  ...args: Input
) => Promise<Output>;

/**
 * A builder for creating and managing resources with actions and notifiers.
 *
 * @template Actions - A record of action names to their respective functions.
 * @template Context - The type of the shared context used by all actions.
 */
class ResourceBuilder<
  Actions extends Record<string, Action<any, any[], any>> = {},
  Context extends any = any
> {
  protected name: string;
  protected _actions: Partial<Actions> = {};
  protected _context: Context = {} as Context;
  protected notifiers: Array<(name: keyof Actions, result: any) => void> = [];

  /**
   * Creates a new resource builder instance.
   *
   * @param name - The name of the resource.
   * @param context - The shared context for actions.
   * @param actions - An optional set of initial actions.
   */
  constructor(name: string, context?: Context, actions?: Partial<Actions>) {
    this.name = name;
    this._context = context || ({} as Context);
    this._actions = actions || {};
  }

  /**
   * Sets the context for the resource.
   *
   * @template Context - The new context type.
   * @param context - The new context to be set.
   * @returns A new `ResourceBuilder` instance with the updated context.
   */
  public setContext<Context = any>(
    context: Context
  ): ResourceBuilder<Actions, Context> {
    return new ResourceBuilder(this.name, context, this._actions);
  }

  /**
   * Registers a new action to the resource.
   *
   * @template Name - The name of the action.
   * @template Input - The input arguments for the action.
   * @template Output - The return type of the action.
   * @param name - The unique name of the action.
   * @param action - The function implementing the action.
   * @returns The updated `ResourceBuilder` instance including the new action.
   */
  public createAction<Name extends string, Input extends any[], Output>(
    name: Name,
    action: Action<Context, Input, Output>
  ): ResourceBuilder<Actions & Record<Name, Action<Context, Input, Output>>> {
    (this._actions as any)[name] = action;
    return this as any;
  }

  /**
   * Adds a notifier that gets triggered after an action is executed.
   *
   * @param notifier - A function that receives the action name and result.
   * @returns The updated `ResourceBuilder` instance.
   */
  public addNotifier(
    notifier: (name: keyof Actions, result: any) => void
  ): ResourceBuilder<Actions> {
    this.notifiers.push(notifier);
    return this as any;
  }

  /**
   * Builds and returns a `BaseResource` instance with the defined actions and context.
   *
   * @returns A `BaseResource` instance.
   */
  public build(): BaseResource<Context, Actions> {
    return new BaseResource(
      this.name,
      this._context,
      this._actions,
      this.notifiers
    );
  }
}

/**
 * A resource that encapsulates actions and allows execution within a shared context.
 *
 * @template Context - The shared context type for the resource.
 * @template Actions - A record of action names to their respective functions.
 */
class BaseResource<
  Context,
  Actions extends Record<string, Action<any, any[], any>>
> {
  protected name: string;
  protected _context: Context;
  protected _actions: Actions;
  protected notifiers: Array<(name: keyof Actions, result: any) => void>;

  /**
   * Creates a new resource instance.
   *
   * @param name - The name of the resource.
   * @param context - The shared context used by all actions.
   * @param actions - A set of registered actions.
   * @param notifiers - An array of notifiers triggered after actions.
   */
  constructor(
    name: string,
    context: Context,
    actions: Partial<Actions>,
    notifiers: Array<(name: keyof Actions, result: any) => void>
  ) {
    this.name = name;
    this._context = context;
    this._actions = actions as Actions;
    this.notifiers = notifiers;
  }

  /**
   * Retrieves the shared context of the resource.
   *
   * @returns The current context.
   */
  get context(): Context {
    return this._context;
  }

  /**
   * Retrieves a registered action by name.
   *
   * @template Name - The name of the action.
   * @param name - The name of the action to retrieve.
   * @returns The corresponding action function, or `undefined` if not found.
   */
  public getAction<Name extends keyof Actions & string>(
    name: Name
  ): Actions[Name] | undefined {
    return this._actions[name];
  }

  /**
   * Executes a registered action with the provided arguments.
   *
   * @template Name - The name of the action.
   * @param name - The action to execute.
   * @param args - The input arguments for the action (excluding context).
   * @returns A promise that resolves to the action's output.
   * @throws An error if the action is not found.
   */
  public async callAction<Name extends keyof Actions & string>(
    name: Name,
    ...args: Parameters<Actions[Name]> extends [infer _Context, ...infer Rest]
      ? Rest
      : never
  ): Promise<ReturnType<Actions[Name]>> {
    const action = this.getAction(name);
    if (!action) {
      throw new Error(`Action ${String(name)} not found`);
    }
    return action(this._context, ...args).then(async (result) => {
      await Promise.all(
        this.notifiers.map((notifier) => notifier(name, result))
      );
      return result;
    });
  }
}

/**
 * Creates a new resource builder instance.
 *
 * @param name - The name of the resource.
 * @returns A `ResourceBuilder` instance for defining actions and context.
 */
export function createResource(name: string) {
  return new ResourceBuilder(name);
}
