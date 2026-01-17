import React from 'react';

const Message = ({ text, type }) => {
  return (
    <div className={`message ${type} show`}>
      {text}
    </div>
  );
};

export default Message;

