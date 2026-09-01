import { createContext, ReactNode, useState, use } from "react";

import { Validator } from "@/types/validator";

const SelectedValidatorContext = createContext<{
  selectedValidator: Validator | null;
  setSelectedValidator: (item: Validator | null) => void;
}>({
  selectedValidator: null,
  setSelectedValidator: () => {},
});

export const SelectedValidatorProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [selectedValidator, setSelectedValidator] = useState<Validator | null>(
    null,
  );
  return (
    <SelectedValidatorContext
      value={{ selectedValidator, setSelectedValidator }}
    >
      {children}
    </SelectedValidatorContext>
  );
};

export const useSelectedValidator = () => use(SelectedValidatorContext);
