const statusLabels = {
  pending: 'received', approved: 'approved', rejected: 'rejected', assigned: 'assigned to a collector',
  collected: 'collected', at_center: 'at the recycling centre', processed: 'being processed',
  completed: 'completed', cancelled: 'cancelled', recycling: 'being recycled',
  placed: 'placed', confirmed: 'confirmed', processing: 'being prepared', shipped: 'on the way',
  delivered: 'delivered', refunded: 'refunded',
};

const labelForStatus = (status) => statusLabels[status] || status;
const shortId = (id) => String(id).slice(-8).toUpperCase();

module.exports = { labelForStatus, shortId };
