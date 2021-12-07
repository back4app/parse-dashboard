import React from 'react';

export const renderModal = ( shouldRender, props, Component ) => {
  if ( shouldRender === true ) {
    return <Component {...props}/>
  }
  return null;
}
