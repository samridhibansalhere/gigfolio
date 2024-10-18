import { Spin } from 'antd';
import React from 'react';

function Spinner({ fullHeight = false }: { fullHeight?: boolean }) {
  return (
    <div className="flex justify-center mt-20">
      <Spin />
    </div>
  );
}

export default Spinner;