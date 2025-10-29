/**
 * Customer Onboarding Handlers
 *
 * Self-service tenant registration and onboarding workflows.
 * Requirements: 6.1, 6.3, 7.2
 */
import { Context } from 'hono';
import { z } from 'zod';
/**
 * Self-service tenant registration
 */
export declare function registerTenant(c: Context): Promise<(Response & import("hono").TypedResponse<{
    success: boolean;
    tenant_id: string;
    message: string;
}>) | (Response & import("hono").TypedResponse<{
    error: string;
    details: ({
        code: "invalid_type";
        expected: z.ZodParsedType;
        received: z.ZodParsedType;
        path: (string | number)[];
        message: string;
        fatal?: boolean | undefined | undefined;
    } | {
        code: "invalid_literal";
        expected: never;
        received: never;
        path: (string | number)[];
        message: string;
        fatal?: boolean | undefined | undefined;
    } | {
        code: "unrecognized_keys";
        keys: string[];
        path: (string | number)[];
        message: string;
        fatal?: boolean | undefined | undefined;
    } | {
        code: "invalid_union";
        unionErrors: {
            issues: ({
                code: "invalid_type";
                expected: z.ZodParsedType;
                received: z.ZodParsedType;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_literal";
                expected: never;
                received: never;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "unrecognized_keys";
                keys: string[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | /*elided*/ any | {
                code: "invalid_union_discriminator";
                options: (string | number | boolean | null | undefined)[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                received: string | number;
                code: "invalid_enum_value";
                options: (string | number)[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_arguments";
                argumentsError: /*elided*/ any;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_return_type";
                returnTypeError: /*elided*/ any;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_date";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_string";
                validation: "ip" | "duration" | "date" | "email" | "url" | "emoji" | "uuid" | "nanoid" | "cuid" | "cuid2" | "ulid" | "base64" | "base64url" | "jwt" | "cidr" | "datetime" | "time" | "regex" | {
                    includes: string;
                    position?: number | undefined | undefined;
                } | {
                    startsWith: string;
                } | {
                    endsWith: string;
                };
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "too_small";
                minimum: number;
                inclusive: boolean;
                exact?: boolean | undefined;
                type: "array" | "string" | "number" | "set" | "date" | "bigint";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "too_big";
                maximum: number;
                inclusive: boolean;
                exact?: boolean | undefined;
                type: "array" | "string" | "number" | "set" | "date" | "bigint";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_intersection_types";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "not_multiple_of";
                multipleOf: number;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "not_finite";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "custom";
                params?: {
                    [x: string]: any;
                } | undefined;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            })[];
            readonly errors: ({
                code: "invalid_type";
                expected: z.ZodParsedType;
                received: z.ZodParsedType;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_literal";
                expected: never;
                received: never;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "unrecognized_keys";
                keys: string[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | /*elided*/ any | {
                code: "invalid_union_discriminator";
                options: (string | number | boolean | null | undefined)[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                received: string | number;
                code: "invalid_enum_value";
                options: (string | number)[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_arguments";
                argumentsError: /*elided*/ any;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_return_type";
                returnTypeError: /*elided*/ any;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_date";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_string";
                validation: "ip" | "duration" | "date" | "email" | "url" | "emoji" | "uuid" | "nanoid" | "cuid" | "cuid2" | "ulid" | "base64" | "base64url" | "jwt" | "cidr" | "datetime" | "time" | "regex" | {
                    includes: string;
                    position?: number | undefined | undefined;
                } | {
                    startsWith: string;
                } | {
                    endsWith: string;
                };
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "too_small";
                minimum: number;
                inclusive: boolean;
                exact?: boolean | undefined;
                type: "array" | "string" | "number" | "set" | "date" | "bigint";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "too_big";
                maximum: number;
                inclusive: boolean;
                exact?: boolean | undefined;
                type: "array" | "string" | "number" | "set" | "date" | "bigint";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_intersection_types";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "not_multiple_of";
                multipleOf: number;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "not_finite";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "custom";
                params?: {
                    [x: string]: any;
                } | undefined;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            })[];
            format: {};
            toString: {};
            readonly message: string;
            readonly isEmpty: boolean;
            addIssue: {};
            addIssues: {};
            flatten: {};
            readonly formErrors: {
                formErrors: string[];
                fieldErrors: {
                    [x: string]: string[] | undefined;
                    [x: number]: string[] | undefined;
                    [x: symbol]: string[] | undefined;
                };
            };
            name: string;
            stack?: string | undefined;
            cause?: undefined;
        }[];
        path: (string | number)[];
        message: string;
        fatal?: boolean | undefined | undefined;
    } | {
        code: "invalid_union_discriminator";
        options: (string | number | boolean | null | undefined)[];
        path: (string | number)[];
        message: string;
        fatal?: boolean | undefined | undefined;
    } | {
        received: string | number;
        code: "invalid_enum_value";
        options: (string | number)[];
        path: (string | number)[];
        message: string;
        fatal?: boolean | undefined | undefined;
    } | {
        code: "invalid_arguments";
        argumentsError: {
            issues: ({
                code: "invalid_type";
                expected: z.ZodParsedType;
                received: z.ZodParsedType;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_literal";
                expected: never;
                received: never;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "unrecognized_keys";
                keys: string[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_union";
                unionErrors: /*elided*/ any[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_union_discriminator";
                options: (string | number | boolean | null | undefined)[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                received: string | number;
                code: "invalid_enum_value";
                options: (string | number)[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | /*elided*/ any | {
                code: "invalid_return_type";
                returnTypeError: /*elided*/ any;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_date";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_string";
                validation: "ip" | "duration" | "date" | "email" | "url" | "emoji" | "uuid" | "nanoid" | "cuid" | "cuid2" | "ulid" | "base64" | "base64url" | "jwt" | "cidr" | "datetime" | "time" | "regex" | {
                    includes: string;
                    position?: number | undefined | undefined;
                } | {
                    startsWith: string;
                } | {
                    endsWith: string;
                };
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "too_small";
                minimum: number;
                inclusive: boolean;
                exact?: boolean | undefined;
                type: "array" | "string" | "number" | "set" | "date" | "bigint";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "too_big";
                maximum: number;
                inclusive: boolean;
                exact?: boolean | undefined;
                type: "array" | "string" | "number" | "set" | "date" | "bigint";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_intersection_types";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "not_multiple_of";
                multipleOf: number;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "not_finite";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "custom";
                params?: {
                    [x: string]: any;
                } | undefined;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            })[];
            readonly errors: ({
                code: "invalid_type";
                expected: z.ZodParsedType;
                received: z.ZodParsedType;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_literal";
                expected: never;
                received: never;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "unrecognized_keys";
                keys: string[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_union";
                unionErrors: /*elided*/ any[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_union_discriminator";
                options: (string | number | boolean | null | undefined)[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                received: string | number;
                code: "invalid_enum_value";
                options: (string | number)[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | /*elided*/ any | {
                code: "invalid_return_type";
                returnTypeError: /*elided*/ any;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_date";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_string";
                validation: "ip" | "duration" | "date" | "email" | "url" | "emoji" | "uuid" | "nanoid" | "cuid" | "cuid2" | "ulid" | "base64" | "base64url" | "jwt" | "cidr" | "datetime" | "time" | "regex" | {
                    includes: string;
                    position?: number | undefined | undefined;
                } | {
                    startsWith: string;
                } | {
                    endsWith: string;
                };
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "too_small";
                minimum: number;
                inclusive: boolean;
                exact?: boolean | undefined;
                type: "array" | "string" | "number" | "set" | "date" | "bigint";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "too_big";
                maximum: number;
                inclusive: boolean;
                exact?: boolean | undefined;
                type: "array" | "string" | "number" | "set" | "date" | "bigint";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_intersection_types";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "not_multiple_of";
                multipleOf: number;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "not_finite";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "custom";
                params?: {
                    [x: string]: any;
                } | undefined;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            })[];
            format: {};
            toString: {};
            readonly message: string;
            readonly isEmpty: boolean;
            addIssue: {};
            addIssues: {};
            flatten: {};
            readonly formErrors: {
                formErrors: string[];
                fieldErrors: {
                    [x: string]: string[] | undefined;
                    [x: number]: string[] | undefined;
                    [x: symbol]: string[] | undefined;
                };
            };
            name: string;
            stack?: string | undefined;
            cause?: undefined;
        };
        path: (string | number)[];
        message: string;
        fatal?: boolean | undefined | undefined;
    } | {
        code: "invalid_return_type";
        returnTypeError: {
            issues: ({
                code: "invalid_type";
                expected: z.ZodParsedType;
                received: z.ZodParsedType;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_literal";
                expected: never;
                received: never;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "unrecognized_keys";
                keys: string[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_union";
                unionErrors: /*elided*/ any[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_union_discriminator";
                options: (string | number | boolean | null | undefined)[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                received: string | number;
                code: "invalid_enum_value";
                options: (string | number)[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_arguments";
                argumentsError: /*elided*/ any;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | /*elided*/ any | {
                code: "invalid_date";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_string";
                validation: "ip" | "duration" | "date" | "email" | "url" | "emoji" | "uuid" | "nanoid" | "cuid" | "cuid2" | "ulid" | "base64" | "base64url" | "jwt" | "cidr" | "datetime" | "time" | "regex" | {
                    includes: string;
                    position?: number | undefined | undefined;
                } | {
                    startsWith: string;
                } | {
                    endsWith: string;
                };
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "too_small";
                minimum: number;
                inclusive: boolean;
                exact?: boolean | undefined;
                type: "array" | "string" | "number" | "set" | "date" | "bigint";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "too_big";
                maximum: number;
                inclusive: boolean;
                exact?: boolean | undefined;
                type: "array" | "string" | "number" | "set" | "date" | "bigint";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_intersection_types";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "not_multiple_of";
                multipleOf: number;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "not_finite";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "custom";
                params?: {
                    [x: string]: any;
                } | undefined;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            })[];
            readonly errors: ({
                code: "invalid_type";
                expected: z.ZodParsedType;
                received: z.ZodParsedType;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_literal";
                expected: never;
                received: never;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "unrecognized_keys";
                keys: string[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_union";
                unionErrors: /*elided*/ any[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_union_discriminator";
                options: (string | number | boolean | null | undefined)[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                received: string | number;
                code: "invalid_enum_value";
                options: (string | number)[];
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_arguments";
                argumentsError: /*elided*/ any;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | /*elided*/ any | {
                code: "invalid_date";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_string";
                validation: "ip" | "duration" | "date" | "email" | "url" | "emoji" | "uuid" | "nanoid" | "cuid" | "cuid2" | "ulid" | "base64" | "base64url" | "jwt" | "cidr" | "datetime" | "time" | "regex" | {
                    includes: string;
                    position?: number | undefined | undefined;
                } | {
                    startsWith: string;
                } | {
                    endsWith: string;
                };
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "too_small";
                minimum: number;
                inclusive: boolean;
                exact?: boolean | undefined;
                type: "array" | "string" | "number" | "set" | "date" | "bigint";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "too_big";
                maximum: number;
                inclusive: boolean;
                exact?: boolean | undefined;
                type: "array" | "string" | "number" | "set" | "date" | "bigint";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "invalid_intersection_types";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "not_multiple_of";
                multipleOf: number;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "not_finite";
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            } | {
                code: "custom";
                params?: {
                    [x: string]: any;
                } | undefined;
                path: (string | number)[];
                message: string;
                fatal?: boolean | undefined | undefined;
            })[];
            format: {};
            toString: {};
            readonly message: string;
            readonly isEmpty: boolean;
            addIssue: {};
            addIssues: {};
            flatten: {};
            readonly formErrors: {
                formErrors: string[];
                fieldErrors: {
                    [x: string]: string[] | undefined;
                    [x: number]: string[] | undefined;
                    [x: symbol]: string[] | undefined;
                };
            };
            name: string;
            stack?: string | undefined;
            cause?: undefined;
        };
        path: (string | number)[];
        message: string;
        fatal?: boolean | undefined | undefined;
    } | {
        code: "invalid_date";
        path: (string | number)[];
        message: string;
        fatal?: boolean | undefined | undefined;
    } | {
        code: "invalid_string";
        validation: "ip" | "duration" | "date" | "email" | "url" | "emoji" | "uuid" | "nanoid" | "cuid" | "cuid2" | "ulid" | "base64" | "base64url" | "jwt" | "cidr" | "datetime" | "time" | "regex" | {
            includes: string;
            position?: number | undefined | undefined;
        } | {
            startsWith: string;
        } | {
            endsWith: string;
        };
        path: (string | number)[];
        message: string;
        fatal?: boolean | undefined | undefined;
    } | {
        code: "too_small";
        minimum: number;
        inclusive: boolean;
        exact?: boolean | undefined;
        type: "array" | "string" | "number" | "set" | "date" | "bigint";
        path: (string | number)[];
        message: string;
        fatal?: boolean | undefined | undefined;
    } | {
        code: "too_big";
        maximum: number;
        inclusive: boolean;
        exact?: boolean | undefined;
        type: "array" | "string" | "number" | "set" | "date" | "bigint";
        path: (string | number)[];
        message: string;
        fatal?: boolean | undefined | undefined;
    } | {
        code: "invalid_intersection_types";
        path: (string | number)[];
        message: string;
        fatal?: boolean | undefined | undefined;
    } | {
        code: "not_multiple_of";
        multipleOf: number;
        path: (string | number)[];
        message: string;
        fatal?: boolean | undefined | undefined;
    } | {
        code: "not_finite";
        path: (string | number)[];
        message: string;
        fatal?: boolean | undefined | undefined;
    } | {
        code: "custom";
        params?: {
            [x: string]: any;
        } | undefined;
        path: (string | number)[];
        message: string;
        fatal?: boolean | undefined | undefined;
    })[];
}>) | (Response & import("hono").TypedResponse<{
    error: string;
    message: any;
}>)>;
/**
 * Get onboarding status
 */
export declare function getOnboardingStatus(c: Context): Promise<Response & import("hono").TypedResponse<{
    tenant_id: string;
    steps_completed: {
        step: string;
        completed: boolean;
    }[];
    completion_percentage: number;
}>>;
