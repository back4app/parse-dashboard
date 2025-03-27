import React from 'react';
import { usePopperTooltip } from 'react-popper-tooltip';
import 'components/Tooltip/PopperTooltip.css';

const PopperTooltip = props => {
  const { children, tooltip, visible, placement, theme = 'dark' } = props;
  const { getArrowProps, getTooltipProps, setTooltipRef, setTriggerRef } = usePopperTooltip({
    placement,
  });

  return (
    <>
      <span ref={setTriggerRef}>{children}</span>
      {visible && (
        <div ref={setTooltipRef} {...getTooltipProps({ className: `tooltip-container ${theme}` })}>
          <div
            {...getArrowProps({
              className: 'tooltip-arrow',
            })}
          />
          {tooltip}
        </div>
      )}
    </>
  );
};

export default PopperTooltip;
