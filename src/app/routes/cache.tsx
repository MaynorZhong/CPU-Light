import React, { type ReactNode, FC, memo } from "react";

type CacheProps = {
  children: ReactNode;
};

const Cache: FC<CacheProps> = props => {
  const { children } = props;
  return <div>Cache</div>;
};

export default memo(Cache);
