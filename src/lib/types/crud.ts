export type FieldConfig = {
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'checkbox' | 'select' | 'hidden';
    required?: boolean;
    hideInTable?: boolean;
    options?: { value: any; name: string; [key: string]: any }[];
    format?: (val: any) => string;
    attributes?: Record<string, string | number | boolean>;

    dependentKey?: string;
    filterOptions?: (options: any[], parentValue: any) => any[];
};