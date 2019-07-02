import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
// 

const ProductDetail = () => (
    <div>Hello world </div>
)

const WrappedProductDetail = connect(
  )(ProductDetail);
  
  export default WrappedProductDetail;