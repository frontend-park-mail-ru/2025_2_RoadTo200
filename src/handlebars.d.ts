declare namespace Handlebars {
    interface TemplateDelegate<T = any> {
        (context: T, options?: RuntimeOptions): string;
    }

    interface RuntimeOptions {
        data?: any;
        helpers?: { [name: string]: Function };
        partials?: { [name: string]: HandlebarsTemplateDelegate };
        decorators?: { [name: string]: Function };
    }

    function compile<T = any>(input: string, options?: CompileOptions): TemplateDelegate<T>;
    function registerHelper(name: string, fn: Function): void;
    function registerPartial(name: string, partial: string | TemplateDelegate): void;

    interface CompileOptions {
        data?: boolean;
        compat?: boolean;
        knownHelpers?: {
            [name: string]: boolean;
        };
        knownHelpersOnly?: boolean;
        noEscape?: boolean;
        strict?: boolean;
        assumeObjects?: boolean;
        preventIndent?: boolean;
        ignoreStandalone?: boolean;
        explicitPartialContext?: boolean;
    }
}

interface HandlebarsTemplateDelegate<T = any> {
    (context: T, options?: any): string;
}

declare const Handlebars: typeof Handlebars;
