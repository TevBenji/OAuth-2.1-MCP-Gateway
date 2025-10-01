import { Hono } from 'hono';
import { Bindings } from '../../types/bindings';
type AdminContext = {
    Bindings: Bindings;
};
declare const app: Hono<AdminContext, {}, "/">;
export default app;
