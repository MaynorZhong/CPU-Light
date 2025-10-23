import { createContext, useState, type ReactNode, FC, useContext } from "react";

type LayoutContextType = {
  showLayout: boolean;
  setShowLayout: (show: boolean) => void;
};

const LayoutContext = createContext<LayoutContextType | null>(null);

type LayoutProviderProps = {
  children?: ReactNode;
};

export const LayoutProvider: FC<LayoutProviderProps> = props => {
  const { children } = props;
  const [showLayout, setShowLayout] = useState(true);
  return (
    <LayoutContext.Provider value={{ showLayout, setShowLayout }}>
      {children}
    </LayoutContext.Provider>
  );
};

const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
};

export default useLayout;
