/**
 * Type declarations for uuid module
 *
 * UUID v9 provides its own types but TypeScript sometimes has trouble finding them.
 * This declaration file ensures proper typing.
 */

declare module 'uuid' {
  export function v4(): string;
  export function v1(): string;
  export function v3(name: string | Buffer, namespace: string | Buffer): string;
  export function v5(name: string | Buffer, namespace: string | Buffer): string;
  export function validate(uuid: string): boolean;
  export function version(uuid: string): number;
  export function parse(uuid: string): Uint8Array;
  export function stringify(arr: Uint8Array, offset?: number): string;
}
