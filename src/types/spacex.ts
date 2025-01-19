// To parse this data:
//
//   import { Convert, APISpaceXResponse } from "./file";
//
//   const aPISpaceXResponse = Convert.toAPISpaceXResponse(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface APISpaceX {
    docs:          Doc[];
    totalDocs:     number;
    offset:        number;
    limit:         number;
    totalPages:    number;
    page:          number;
    pagingCounter: number;
    hasPrevPage:   boolean;
    hasNextPage:   boolean;
    prevPage:      null;
    nextPage:      number;
}

export interface Doc {
    fairings:              Fairings | null;
    links:                 Links;
    static_fire_date_utc:  null | string;
    static_fire_date_unix: number | null;
    net:                   boolean;
    window:                number;
    rocket:                Rocket;
    success:               boolean;
    failures:              Failure[];
    details:               null | string;
    crew:                  any[];
    ships:                 string[];
    capsules:              string[];
    payloads:              string[];
    launchpad:             Launchpad;
    flight_number:         number;
    name:                  string;
    date_utc:              string;
    date_unix:             number;
    date_local:            string;
    date_precision:        DatePrecision;
    upcoming:              boolean;
    cores:                 Core[];
    auto_update:           boolean;
    tbd:                   boolean;
    launch_library_id:     null;
    id:                    string;
}

export interface Core {
    core:            string;
    flight:          number;
    gridfins:        boolean;
    legs:            boolean;
    reused:          boolean;
    landing_attempt: boolean;
    landing_success: boolean | null;
    landing_type:    null | string;
    landpad:         null;
}

export enum DatePrecision {
    Hour = "hour",
}

export interface Failure {
    time:     number;
    altitude: number | null;
    reason:   string;
}

export interface Fairings {
    reused:           boolean | null;
    recovery_attempt: boolean | null;
    recovered:        boolean | null;
    ships:            any[];
}

export enum Launchpad {
    The5E9E4501F509094Ba4566F84 = "5e9e4501f509094ba4566f84",
    The5E9E4502F509092B78566F87 = "5e9e4502f509092b78566f87",
    The5E9E4502F5090995De566F86 = "5e9e4502f5090995de566f86",
}

export interface Links {
    patch:      Patch;
    reddit:     Reddit;
    flickr:     Flickr;
    presskit:   null | string;
    webcast:    string;
    youtube_id: string;
    article:    string;
    wikipedia:  string;
}

export interface Flickr {
    small:    any[];
    original: any[];
}

export interface Patch {
    small: string;
    large: string;
}

export interface Reddit {
    campaign: null;
    launch:   null | string;
    media:    null;
    recovery: null;
}

export enum Rocket {
    The5E9D0D95Eda69955F709D1Eb = "5e9d0d95eda69955f709d1eb",
    The5E9D0D95Eda69973A809D1Ec = "5e9d0d95eda69973a809d1ec",
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export namespace Convert {
    export function toAPISpaceXResponse(json: string): APISpaceX {
        return cast(JSON.parse(json), r("APISpaceXResponse"));
    }

    export function aPISpaceXResponseToJson(value: APISpaceX): string {
        return JSON.stringify(uncast(value, r("APISpaceXResponse")), null, 2);
    }

    function invalidValue(typ: any, val: any): never {
        throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`);
    }

    function jsonToJSProps(typ: any): any {
        if (typ.jsonToJS === undefined) {
            var map: any = {};
            typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
            typ.jsonToJS = map;
        }
        return typ.jsonToJS;
    }

    function jsToJSONProps(typ: any): any {
        if (typ.jsToJSON === undefined) {
            var map: any = {};
            typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
            typ.jsToJSON = map;
        }
        return typ.jsToJSON;
    }

    function transform(val: any, typ: any, getProps: any): any {
        function transformPrimitive(typ: string, val: any): any {
            if (typeof typ === typeof val) return val;
            return invalidValue(typ, val);
        }

        function transformUnion(typs: any[], val: any): any {
            // val must validate against one typ in typs
            var l = typs.length;
            for (var i = 0; i < l; i++) {
                var typ = typs[i];
                try {
                    return transform(val, typ, getProps);
                } catch (_) {}
            }
            return invalidValue(typs, val);
        }

        function transformEnum(cases: string[], val: any): any {
            if (cases.indexOf(val) !== -1) return val;
            return invalidValue(cases, val);
        }

        function transformArray(typ: any, val: any): any {
            // val must be an array with no invalid elements
            if (!Array.isArray(val)) return invalidValue("array", val);
            return val.map(el => transform(el, typ, getProps));
        }

        function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
            if (val === null || typeof val !== "object" || Array.isArray(val)) {
                return invalidValue("object", val);
            }
            var result: any = {};
            Object.getOwnPropertyNames(props).forEach(key => {
                const prop = props[key];
                const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
                result[prop.key] = transform(v, prop.typ, getProps);
            });
            Object.getOwnPropertyNames(val).forEach(key => {
                if (!Object.prototype.hasOwnProperty.call(props, key)) {
                    result[key] = transform(val[key], additional, getProps);
                }
            });
            return result;
        }

        if (typ === "any") return val;
        if (typ === null) {
            if (val === null) return val;
            return invalidValue(typ, val);
        }
        if (typ === false) return invalidValue(typ, val);
        while (typeof typ === "object" && typ.ref !== undefined) {
            typ = typeMap[typ.ref];
        }
        if (Array.isArray(typ)) return transformEnum(typ, val);
        if (typeof typ === "object") {
            return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
                : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
                : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
                : invalidValue(typ, val);
        }
        return transformPrimitive(typ, val);
    }

    function cast<T>(val: any, typ: any): T {
        return transform(val, typ, jsonToJSProps);
    }

    function uncast<T>(val: T, typ: any): any {
        return transform(val, typ, jsToJSONProps);
    }

    function a(typ: any) {
        return { arrayItems: typ };
    }

    function u(...typs: any[]) {
        return { unionMembers: typs };
    }

    function o(props: any[], additional: any) {
        return { props, additional };
    }

    function m(additional: any) {
        return { props: [], additional };
    }

    function r(name: string) {
        return { ref: name };
    }

    const typeMap: any = {
        "APISpaceXResponse": o([
            { json: "docs", js: "docs", typ: a(r("Doc")) },
            { json: "totalDocs", js: "totalDocs", typ: 0 },
            { json: "offset", js: "offset", typ: 0 },
            { json: "limit", js: "limit", typ: 0 },
            { json: "totalPages", js: "totalPages", typ: 0 },
            { json: "page", js: "page", typ: 0 },
            { json: "pagingCounter", js: "pagingCounter", typ: 0 },
            { json: "hasPrevPage", js: "hasPrevPage", typ: true },
            { json: "hasNextPage", js: "hasNextPage", typ: true },
            { json: "prevPage", js: "prevPage", typ: null },
            { json: "nextPage", js: "nextPage", typ: 0 },
        ], false),
        "Doc": o([
            { json: "fairings", js: "fairings", typ: u(r("Fairings"), null) },
            { json: "links", js: "links", typ: r("Links") },
            { json: "static_fire_date_utc", js: "static_fire_date_utc", typ: u(null, "") },
            { json: "static_fire_date_unix", js: "static_fire_date_unix", typ: u(0, null) },
            { json: "net", js: "net", typ: true },
            { json: "window", js: "window", typ: 0 },
            { json: "rocket", js: "rocket", typ: r("Rocket") },
            { json: "success", js: "success", typ: true },
            { json: "failures", js: "failures", typ: a(r("Failure")) },
            { json: "details", js: "details", typ: u(null, "") },
            { json: "crew", js: "crew", typ: a("any") },
            { json: "ships", js: "ships", typ: a("") },
            { json: "capsules", js: "capsules", typ: a("") },
            { json: "payloads", js: "payloads", typ: a("") },
            { json: "launchpad", js: "launchpad", typ: r("Launchpad") },
            { json: "flight_number", js: "flight_number", typ: 0 },
            { json: "name", js: "name", typ: "" },
            { json: "date_utc", js: "date_utc", typ: "" },
            { json: "date_unix", js: "date_unix", typ: 0 },
            { json: "date_local", js: "date_local", typ: "" },
            { json: "date_precision", js: "date_precision", typ: r("DatePrecision") },
            { json: "upcoming", js: "upcoming", typ: true },
            { json: "cores", js: "cores", typ: a(r("Core")) },
            { json: "auto_update", js: "auto_update", typ: true },
            { json: "tbd", js: "tbd", typ: true },
            { json: "launch_library_id", js: "launch_library_id", typ: null },
            { json: "id", js: "id", typ: "" },
        ], false),
        "Core": o([
            { json: "core", js: "core", typ: "" },
            { json: "flight", js: "flight", typ: 0 },
            { json: "gridfins", js: "gridfins", typ: true },
            { json: "legs", js: "legs", typ: true },
            { json: "reused", js: "reused", typ: true },
            { json: "landing_attempt", js: "landing_attempt", typ: true },
            { json: "landing_success", js: "landing_success", typ: u(true, null) },
            { json: "landing_type", js: "landing_type", typ: u(null, "") },
            { json: "landpad", js: "landpad", typ: null },
        ], false),
        "Failure": o([
            { json: "time", js: "time", typ: 0 },
            { json: "altitude", js: "altitude", typ: u(0, null) },
            { json: "reason", js: "reason", typ: "" },
        ], false),
        "Fairings": o([
            { json: "reused", js: "reused", typ: u(true, null) },
            { json: "recovery_attempt", js: "recovery_attempt", typ: u(true, null) },
            { json: "recovered", js: "recovered", typ: u(true, null) },
            { json: "ships", js: "ships", typ: a("any") },
        ], false),
        "Links": o([
            { json: "patch", js: "patch", typ: r("Patch") },
            { json: "reddit", js: "reddit", typ: r("Reddit") },
            { json: "flickr", js: "flickr", typ: r("Flickr") },
            { json: "presskit", js: "presskit", typ: u(null, "") },
            { json: "webcast", js: "webcast", typ: "" },
            { json: "youtube_id", js: "youtube_id", typ: "" },
            { json: "article", js: "article", typ: "" },
            { json: "wikipedia", js: "wikipedia", typ: "" },
        ], false),
        "Flickr": o([
            { json: "small", js: "small", typ: a("any") },
            { json: "original", js: "original", typ: a("any") },
        ], false),
        "Patch": o([
            { json: "small", js: "small", typ: "" },
            { json: "large", js: "large", typ: "" },
        ], false),
        "Reddit": o([
            { json: "campaign", js: "campaign", typ: null },
            { json: "launch", js: "launch", typ: u(null, "") },
            { json: "media", js: "media", typ: null },
            { json: "recovery", js: "recovery", typ: null },
        ], false),
        "DatePrecision": [
            "hour",
        ],
        "Launchpad": [
            "5e9e4501f509094ba4566f84",
            "5e9e4502f509092b78566f87",
            "5e9e4502f5090995de566f86",
        ],
        "Rocket": [
            "5e9d0d95eda69955f709d1eb",
            "5e9d0d95eda69973a809d1ec",
        ],
    };
}
