import Button from 'components/Button/Button.react';
import React, { useState } from 'react';
import back4app2 from '../../lib/back4app2';
import {loadStripe} from '@stripe/stripe-js';
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout
} from '@stripe/react-stripe-js';
import B4aModal from 'components/B4aModal/B4aModal.react';

const stripePromise = loadStripe(b4aSettings.BACK4APP_STRIPE_PUBLIC_KEY);

const StripeValidateCard = ({ onClick, onCancel, onError, onSuccess }) => {
  const [showStripe, setShowStripe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState(null);

  const handleOnClick = async () => {
    if (typeof onClick === 'function') {
      onClick();
    }

    setIsLoading(true);
    setShowStripe(true);
    try {
      const response = await back4app2.createStripeSession(window.location.href);
      setOptions(() => ({
        clientSecret: response,
        onComplete: onComplete
      }))
      setShowStripe(true);
    } catch (err) {
      console.log('error in creating stripe session');
      onError(err);
      setIsLoading(false);
    }
  }

  const onComplete = async (result) => {
    if (result?.error) {
      setIsLoading(false);
      onError(result.error);
    } else {
      console.log('onComplete');
      await onSuccess();
      setShowStripe(false);
    }
  }

  const handleOnCancel = () => {
    setShowStripe(false);
    setIsLoading(false);
    if (typeof onCancel === 'function') {
      onCancel();
    }
  }

  return (
    <div>
      <Button
        type='secondary'
        value={isLoading ? 'Loading...' : 'Validate Now'}
        disabled={isLoading}
        width='auto'
        additionalStyles={{ background: 'white', color: 'black', border: 'none' }}
        onClick={handleOnClick}
      />

      {showStripe && options?.clientSecret ? (
        <B4aModal type={B4aModal.Types.DEFAULT} showCancel={true} onCancel={handleOnCancel} customFooter={<></>} minWidth="80%">
          <div className="checkout-container" style={{ overflow: 'auto', position: 'relative', maxHeight: '80vh' }}>
            <EmbeddedCheckoutProvider
              stripe={stripePromise}
              options={options}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </B4aModal>
      ) : null}
    </div>
  )
}

export default StripeValidateCard;

