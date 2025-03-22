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

type Method = "GET" | "POST" | "PUT" | "DELETE";

type Api<Route extends string, Actions> = {
  method: Method;
  route: Route;
  action: keyof Actions;
};

type TypedNotifier<A extends Action<any, any[], any>> = (
  result: Awaited<ReturnType<A>>,
) => void;

/**
 * A builder for creating and managing resources with actions and notifiers.
 *
 * @template Actions - A record of action names to their respective functions.
 * @template Context - The type of the shared context used by all actions.
 */
class ResourceBuilder<
  Actions extends Record<string, Action<any, any[], any>> = {},
  Apis extends Record<string, Api<any, Actions>> = {},
  Context extends any = any,
> {
  protected _name: string;
  protected _actions: Partial<Actions> = {};
  protected _apis: Partial<Apis> = {};
  protected _context: Context = {} as Context;
  private _notifiers: Map<keyof Actions, Set<TypedNotifier<any>>>;

  /**
   * Creates a new resource builder instance.
   *
   * @param name - The name of the resource.
   * @param context - The shared context for actions.
   * @param actions - An optional set of initial actions.
   */
  constructor(name: string, context?: Context, actions?: Partial<Actions>) {
    this._name = name;
    this._context = context || ({} as Context);
    this._actions = actions || {};
    this._notifiers = new Map();
  }

  /**
   * Retrieves the name of the resource.
   */
  get name(): string {
    return this._name;
  }

  /**
   * Sets the context for the resource.
   *
   * @template Context - The new context type.
   * @param context - The new context to be set.
   * @returns A new `ResourceBuilder` instance with the updated context.
   */
  public setContext<Context = any>(
    context: Context,
  ): ResourceBuilder<Actions, Apis, Context> {
    return new ResourceBuilder(this._name, context, this._actions);
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
    action: Action<Context, Input, Output>,
  ): ResourceBuilder<
    Actions & Record<Name, Action<Context, Input, Output>>,
    Apis,
    Context
  > {
    (this._actions as any)[name] = action;
    return this as any;
  }

  /**
   * Registers a notifier for an action.
   *
   * @param name - The name of the action.
   * @param notifier - A function to call with the result.
   */
  public addNotifier<Name extends keyof Actions>(
    name: Name,
    notifier: TypedNotifier<Actions[Name]>,
  ): this {
    if (!this._notifiers.has(name)) {
      this._notifiers.set(name, new Set());
    }
    this._notifiers.get(name)!.add(notifier);
    return this;
  }

  public addApi<Route extends string, Name extends keyof Actions & string>(
    route: Route,
    name: Name,
    method: Method = "GET",
  ): ResourceBuilder<
    Actions,
    Apis & Record<Route, { method: Method; route: Route; action: Name }>,
    Context
  > {
    (this._apis as any)[route] = { method, route, action: name };
    return this as any;
  }

  /**
   * Builds and returns a `BaseResource` instance with the defined actions and context.
   *
   * @returns A `BaseResource` instance.
   */
  public build(): BaseResource<Actions, Apis, Context> {
    return new BaseResource(
      this._name,
      this._context,
      this._actions,
      this._notifiers,
      this._apis,
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
  Actions extends Record<string, Action<any, any[], any>>,
  Apis extends Record<string, Api<any, Actions>> = {},
  Context extends any = any,
> {
  protected _name: string;
  protected _context: Context;
  protected _actions: Actions;
  protected _notifiers: Map<keyof Actions, Set<TypedNotifier<any>>>;
  protected _apis: Apis;

  /**
   * Creates a new resource instance.
   *
   * @param name - The name of the resource.
   * @param context - The shared context used by all actions.
   * @param actions - A set of registered actions.
   * @param notifiers - An array of notifiers triggered after actions.
   * @param apis - A set of registered APIs.
   */
  constructor(
    name: string,
    context: Context,
    actions: Partial<Actions>,
    notifiers: Map<keyof Actions, Set<TypedNotifier<any>>>,
    apis: Partial<Apis>,
  ) {
    this._name = name;
    this._context = context;
    this._actions = actions as Actions;
    this._notifiers = notifiers;
    this._apis = apis as Apis;
  }

  /**
   * Retrieves the shared context of the resource.
   *
   * @returns The current context.
   */
  get context(): Context {
    return this._context;
  }

  get notifiers() {
    return this._notifiers;
  }

  /**
   * Retrieves a registered action by name.
   *
   * @template Name - The name of the action.
   * @param name - The name of the action to retrieve.
   * @returns The corresponding action function, or `undefined` if not found.
   */
  public getAction<Name extends keyof Actions & string>(
    name: Name,
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

    const result = await action(this._context, ...args);
    const notifiers = this._notifiers.get(name);

    if (notifiers?.size) {
      await Promise.all([...notifiers].map((fn) => fn(result)));
    }

    return result;
  }

  /**
   *
   * @param route
   * @param method
   * @returns
   */
  public getApi<Route extends keyof Apis & string>(
    route: Route,
    method: Method,
  ): Apis[Route] | undefined {
    const api = this._apis[route];
    if (!api || api.method !== method) return undefined;
    return api;
  }

  /**
   *
   * @param route
   * @param method
   * @param args
   * @returns
   */
  public async callApi<Route extends keyof Apis & string>(
    route: Route,
    method: Apis[Route]["method"], // Ensure method matches the expected type for the route
    ...args: Parameters<Actions[Apis[Route]["action"]]> extends [
      infer _Context,
      ...infer Rest,
    ]
      ? Rest
      : never
  ): Promise<ReturnType<Actions[Apis[Route]["action"]]>> {
    const api = this.getApi(route, method);
    if (!api) {
      throw new Error(`API ${String(route)} not found`);
    }
    if (api.method !== method) {
      throw new Error(`Method ${method} not allowed for API ${route}`);
    }
    return this.callAction(api.action as keyof Actions & string, ...args);
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
