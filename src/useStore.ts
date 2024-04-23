import create from "zustand";
import { evaluate } from "mathjs";

export interface Category {
  name: string;
  category: string;
  value: string;
  id: string;
}

const useStore = create((set) => ({
  input: "",
  suggestions: [],
  calculatedValue: "",

  setInput: (input: any) => set({ input }),
  setSuggestions: (suggestions: Category[]) => set({ suggestions }),
  setCalculatedValue: (calculatedValue: any) => set({ calculatedValue }),

  calculateValues: (input: string) => {
    // Extract tokens with numbers and operators. Assume formatted input: "Name (value)"
    const pattern = /([+\-*/^]?\s*)\w+\s*\((\d+)\)/g;
    let match;
    let expression = "";

    while ((match = pattern.exec(input))) {
      expression += `${match[1]}${match[2]}`;
    }

    if (expression === "") {
      set({ calculatedValue: "No valid input" });
      return;
    }

    try {
      const result = evaluate(expression);
      set({ calculatedValue: result });
    } catch (error) {
      set({ calculatedValue: "Invalid expression" });
    }
  },
}));

export default useStore;
