export interface SolverWasmModuleOptions {
  locateFile?: (path: string, scriptDirectory: string) => string;
}

export interface SolverWasmModule {
  ccall(
    name: 'solve',
    returnType: 'string',
    argTypes: ['string'],
    args: [string]
  ): string;
}

declare function Module(
  moduleArg?: SolverWasmModuleOptions
): Promise<SolverWasmModule>;

export default Module;
