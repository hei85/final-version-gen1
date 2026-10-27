/**
 * Resolve env-configured filesystem paths without mangling Windows absolutes on POSIX hosts.
 * `path.resolve("C:\\foo")` on macOS/Linux incorrectly joins cwd, which breaks overrides and tests.
 */
export declare function resolveEnvPath(value: string): string;
