import { type ReactNode, FC, memo } from "react";

type HeaderProps = {
  children?: ReactNode;
};

const Header: FC<HeaderProps> = props => {
  const {} = props;
  return <div className="!text-red-700">header</div>;
};

export default memo(Header);
