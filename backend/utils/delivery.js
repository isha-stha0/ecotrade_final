const DELIVERY_CHARGES = {
  inside_ringroad: 100,
  outside_ringroad: 200,
};

function getDeliveryCharge(zone) {
  return DELIVERY_CHARGES[zone] || DELIVERY_CHARGES.inside_ringroad;
}

module.exports = { DELIVERY_CHARGES, getDeliveryCharge };
