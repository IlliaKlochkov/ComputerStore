export type FilterType = 'text' | 'select' | 'number' | 'date';

export type FilterConfig = {
    key: string;
    label: string;
    type: FilterType;
    placeholder?: string;
    options?: { value: string | number; name: string; [key: string]: any }[];
    dependentKey?: string;
    filterOptions?: (options: any[], parentValue: any) => any[];
};

export type FilterGroup = {
    type: 'group';
    label?: string;
    children: FilterConfig[];
};

export type FilterItem = FilterConfig | FilterGroup;