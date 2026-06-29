import { ReactNode, SelectHTMLAttributes } from 'react';

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  children: ReactNode;
  onChange?: (value: string) => void;
}

export function Select({ children, onChange, ...props }: SelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <select
      {...props}
      onChange={handleChange}
      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
    >
      {children}
    </select>
  );
}

// Export sub-components for compatibility with more complex Select usage
export function SelectTrigger({ children, ...props }: { children: ReactNode } & SelectHTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className="relative">
      {children}
    </div>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return <span className="text-gray-500">{placeholder}</span>;
}

export function SelectContent({ children, ...props }: { children: ReactNode } & SelectHTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
      {children}
    </div>
  );
}

export function SelectItem({ value, children, ...props }: { value: string; children: ReactNode } & SelectHTMLAttributes<HTMLOptionElement>) {
  return (
    <option {...props} value={value} className="px-3 py-2 hover:bg-gray-100 cursor-pointer">
      {children}
    </option>
  );
}