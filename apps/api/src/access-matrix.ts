import "reflect-metadata";
import { RequestMethod } from "@nestjs/common";
import { ROLES_KEY } from "./common/decorators/roles.decorator";

export interface RouteInfo { route: string; roles: string[] | null; guards: string[] }

const METHOD_NAMES: Record<number, string> = { [RequestMethod.GET]: "GET", [RequestMethod.POST]: "POST", [RequestMethod.PUT]: "PUT", [RequestMethod.DELETE]: "DELETE", [RequestMethod.PATCH]: "PATCH" };
const join = (...p: string[]) => "/" + p.map((x) => x.replace(/^\/|\/$/g, "")).filter(Boolean).join("/");

function collectControllers(mod: any, seen = new Set<any>(), out: any[] = []): any[] {
  const m = mod?.module ?? mod; // dynamic modules look like { module, ... }
  if (!m || seen.has(m)) return out;
  seen.add(m);
  for (const c of Reflect.getMetadata("controllers", m) ?? []) if (!out.includes(c)) out.push(c);
  for (const i of Reflect.getMetadata("imports", m) ?? []) collectControllers(i, seen, out);
  return out;
}

/** Every HTTP route in the app with the roles that may call it (null = no @Roles: any signed-in role) and its guards. */
export function buildAccessMatrix(appModule: any): RouteInfo[] {
  const rows: RouteInfo[] = [];
  for (const ctl of collectControllers(appModule)) {
    const base = Reflect.getMetadata("path", ctl) ?? "";
    const classGuards = (Reflect.getMetadata("__guards__", ctl) ?? []).map((g: any) => g.name);
    for (const name of Object.getOwnPropertyNames(ctl.prototype)) {
      const fn = ctl.prototype[name];
      if (name === "constructor" || typeof fn !== "function") continue;
      const method = Reflect.getMetadata("method", fn);
      const path = Reflect.getMetadata("path", fn);
      if (method === undefined || path === undefined) continue;
      const roles = Reflect.getMetadata(ROLES_KEY, fn) ?? Reflect.getMetadata(ROLES_KEY, ctl) ?? null;
      const guards = [...classGuards, ...(Reflect.getMetadata("__guards__", fn) ?? []).map((g: any) => g.name)];
      rows.push({ route: `${METHOD_NAMES[method] ?? method} ${join(base, path)}`, roles: roles && roles.length ? [...roles] : null, guards });
    }
  }
  return rows.sort((a, b) => a.route.localeCompare(b.route));
}
