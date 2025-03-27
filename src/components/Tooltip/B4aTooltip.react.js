import React, { useEffect, useState, useRef } from 'react';
import PropTypes from 'lib/PropTypes';
import styles from 'components/Tooltip/B4aTooltip.scss';

const B4aTooltip = ({ value, children, placement = 'top', visible = false, theme = 'dark' }) => {
  const tooltipRef = useRef(null);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const [arrowStyle, setArrowStyle] = useState({});

  useEffect(() => {
    if (!visible || !tooltipRef.current) {
      return;
    }

    const updatePosition = () => {
      const tooltipElement = tooltipRef.current;
      const parentElement = tooltipElement.parentElement;

      if (!parentElement) {
        return;
      }

      const rect = parentElement.getBoundingClientRect();
      const tooltipRect = tooltipElement.getBoundingClientRect();

      // Calculate position based on placement
      let top = rect.top;
      let left = rect.left + (rect.width / 2);

      const OFFSET = 4; // Distance between tooltip and parent element

      switch (placement) {
        case 'top':
          top = rect.top - OFFSET - tooltipRect.height;
          break;
        case 'bottom':
          top = rect.bottom + OFFSET;
          break;
        case 'left':
          top = rect.top + (rect.height / 2);
          left = rect.left - OFFSET - tooltipRect.width;
          break;
        case 'right':
          top = rect.top + (rect.height / 2);
          left = rect.right + OFFSET;
          break;
      }

      setTooltipStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        transform: placement === 'top' ? 'translate(-50%, 0)' :
          placement === 'bottom' ? 'translate(-50%, 0)' :
            placement === 'left' ? 'translate(0, -50%)' :
              'translate(0, -50%)'
      });

      // Calculate arrow position
      const arrowPosition = {
        position: 'absolute'
      };

      switch (placement) {
        case 'top':
          arrowPosition.bottom = '-4px';
          arrowPosition.left = '50%';
          arrowPosition.transform = 'translate(-50%, 0) rotate(45deg)';
          break;
        case 'bottom':
          arrowPosition.top = '-4px';
          arrowPosition.left = '50%';
          arrowPosition.transform = 'translate(-50%, 0) rotate(225deg)';
          break;
        case 'left':
          arrowPosition.right = '-4px';
          arrowPosition.top = '50%';
          arrowPosition.transform = 'translate(0, -50%) rotate(135deg)';
          break;
        case 'right':
          arrowPosition.left = '-4px';
          arrowPosition.top = '50%';
          arrowPosition.transform = 'translate(0, -50%) rotate(-45deg)';
          break;
      }

      setArrowStyle(arrowPosition);
    };

    // Initial position update
    requestAnimationFrame(() => {
      updatePosition();
    });

    const handleUpdate = () => {
      requestAnimationFrame(updatePosition);
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);

    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
    };
  }, [visible, placement]);

  return (
    <div className={styles.tooltipWrapper}>
      {children}
      {visible && (
        <div
          ref={tooltipRef}
          className={`${styles.tooltip} ${theme === 'dark' ? styles.dark : ''}`}
          style={tooltipStyle}
        >
          <div className={styles.tooltipContent}>
            {value}
          </div>
          <div
            className={styles.tooltipArrow}
            style={arrowStyle}
          />
        </div>
      )}
    </div>
  );
};

B4aTooltip.propTypes = {
  value: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  placement: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  visible: PropTypes.bool,
  theme: PropTypes.oneOf(['light', 'dark'])
};

export default B4aTooltip;
