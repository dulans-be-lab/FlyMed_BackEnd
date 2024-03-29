const PharmacyOrder = require('./../db/pharmacy_order');
const Customer = require('./../db/customer');
const Pharmacy = require('./../db/pharmacy');
const EstimationToCustomer = require('./../db/estimation_to_customer');
const TrackMyID = require('./../db/track_my_id');


const Response = require('./../../config/Response');


exports.sendEstimation = (req, res, next) => {
  EstimationToCustomer.findOne({
    order_id: req.body.order_id,
    supplier_id: req.body.supplier_id
  }).then(addedEstimation => {
    if (addedEstimation == null) {
      EstimationToCustomer.save(req.body).then(myestimation1 => {
        console.log("estimation added");
        var estimation_id = myestimation1._id;
        var order_id = myestimation1.order_id;
        PharmacyOrder.findOne({
          order_id_by_us: order_id
        }).then(pharmacyorder => {
          console.log("pharmacy order ");
          console.log(pharmacyorder);
          var estimation_nums_to_order = pharmacyorder.estimation_nums_to_order;
          var unanswered_estimation_nums_to_order = pharmacyorder.unanswered_estimation_nums_to_order;
          estimation_nums_to_order.push(estimation_id);
          console.log(estimation_nums_to_order);
          unanswered_estimation_nums_to_order.push(estimation_id);
          PharmacyOrder.updateOne({
            order_id_by_us: order_id
          }, {
            $set: {
              estimation_nums_to_order: estimation_nums_to_order,
              unanswered_estimation_nums_to_order: unanswered_estimation_nums_to_order
            }
          }).then(updatedOrder1 => {
            console.log("estimation send to order");
            console.log(updatedOrder1);
            Pharmacy.search_supplier({
              _id: req.body.supplier_id
            }).then(supplier => {
              var normal_order_queue = supplier.normal_order_queue;
              console.log(normal_order_queue);
              // normal_order_queue.pop(req.body.order_id);
              var index = normal_order_queue.indexOf(req.body.order_id);
              if (index > -1) {
                normal_order_queue.splice(index, 1);
              }
              Pharmacy.updateOne({
                _id: req.body.supplier_id
              }, {
                $set: {
                  normal_order_queue: normal_order_queue
                }
              }).then(updatedSup => {
                res.status(200).json({
                  message: 'estimation send to order'
                });
              }).catch(error => {
                res.status(400).json({
                  message: 'Internal Server Error'
                });
              });
            }).catch(error => {
              res.status(400).json({
                message: 'Internal Server Error'
              });
            });

          }).catch(error3 => {
            res.status(400).json({
              message: 'Internal Server Error'
            });
          });
        }).catch(error2 => {
          res.status(400).json({
            message: 'Internal Server Error'
          });
        });
      }).catch(error1 => {
        console.log(error1);
        res.status(400).json({
          message: 'Internal Server Error'
        });
      });
    } else {
      res.status(200).json({
        message: 'already added'
      });
      console.log("already added");
    }
  }).catch(error4 => {
    console.log(error4);
    res.status(400).json({
      message: 'Internal Server Error'
    });
  });
};


exports.finalBilling = (req, res, next) => {

  EstimationToCustomer.updateOne({
    _id: req.body.estimation_id
  }, {
    $set: {
      invoice_date: req.body.invoice_date,
      invoice_time: req.body.invoice_time,
      total_net_amount: req.body.total_net_amount,
      cancelled_items: req.body.cancelled_items,
      available_items: req.body.available_items,
    }
  }).then(estimation1 => {
    console.log("invoice maked!!!...");
    console.log(estimation1);
    TrackMyID.findOne({
      estimation_id: req.body.estimation_id
    }).then(track_my_id => {
      console.log(track_my_id);
      console.log(track_my_id.order_id);
      PharmacyOrder.findOne({
        order_id_by_us: track_my_id.order_id
      }).then(custOrder => {
        Customer.search_customer({
          _id: custOrder.customer_id
        }).then(customer => {
          console.log(customer);
          var invoices_received_queue = customer.invoices_received_queue;
          invoices_received_queue.push(track_my_id.track_id);

          Customer.updateOne({
            _id: custOrder.customer_id
          }, {
            $set: {
              invoices_received_queue: invoices_received_queue
            }
          }).then(updatedCust => {

          }).catch();
        }).catch();
      }).catch();
    }).catch();


  }).catch(error => {
    console.log(error);
  });


};

exports.viewPharmEstimation = (req, res, next) => {
  var customerEstimation;

  EstimationToCustomer.findOne({
    _id: req.params.estimation_id
  }).then(estimation1 => {
    customerEstimation = estimation1;

    console.log(customerEstimation);
    res.status(200).json({
      customerEstimation: customerEstimation
    });
  }).catch(err1 => {
    console.log(err1);
    res.status(200).json({
      message: "Incorrect Estimation ID"
    });
  });

};

exports.declinePharmEstimation = (req, res, next) => {
  var customerEstimation;
  var pharmacyOrder;
  EstimationToCustomer.findOne({
    _id: req.body.estimation_id
  }).then(estimation1 => {
    customerEstimation = estimation1;
    console.log(customerEstimation);
    var estimation_declined_reason = req.body.estimation_declined_reason;
    var estimation_status = 'declined';
    EstimationToCustomer.updateOne({
      _id: req.body.estimation_id
    }, {
      $set: {
        estimation_declined_reason: estimation_declined_reason,
        estimation_status: estimation_status
      }
    }).then(declined_est => {
      console.log(declined_est);
      // unanswered_estimation_nums_to_order eken ain karann oona
      PharmacyOrder.findOne({
        order_id_by_us: customerEstimation.order_id
      }).then(order => {
        pharmacyOrder = order;
        var unanswered_estimation_nums_to_order = pharmacyOrder.unanswered_estimation_nums_to_order;

        var index = unanswered_estimation_nums_to_order.indexOf(customerEstimation._id);
        if (index > -1) {
          unanswered_estimation_nums_to_order.splice(index, 1);
        }

        PharmacyOrder.updateOne({
          order_id_by_us: customerEstimation.order_id
        }, {
          $set: {
            unanswered_estimation_nums_to_order: unanswered_estimation_nums_to_order
          }
        }).then(updated_order => {
          console.log(updated_order);
          res.status(200).json({
            message: "estimation declined"
          });
        }).catch(error => {
          console.log(error);
        });

      }).catch(error => {
        console.log(error);
      });

    }).catch(error => {
      console.log(error);
    });
    //
    // console.log(customerEstimation);
    // res.status(200).json({
    //   customerEstimation: customerEstimation
    // });
  }).catch(err1 => {
    console.log(err1);
    res.status(200).json({
      message: "Incorrect Estimation ID"
    });
  });
};

exports.changeRequirementsNeedNewEstimation = (req, res, next) => {
  var requirementsChangedEstimation;
  var estimationOwnedPharmacy;
  var newRequiremntsRequestedOrder;
  EstimationToCustomer.updateOne({
    _id: req.body.estimation_id
  }, {
    $set: {
      available_items: req.body.available_items,
      need_new_estimation: true
    }
  }).then(updatedRequest => {
    requirementsChangedEstimation = updatedRequest;
    console.log(requirementsChangedEstimation);
    console.log("available_items & need_new_estimation changed");

    Pharmacy.findOne({
      _id: requirementsChangedEstimation.supplier_id
    }).then(pharmacy => {
      estimationOwnedPharmacy = pharmacy;
      console.log(estimationOwnedPharmacy);
      console.log(requirementsChangedEstimation._id);
      var customer_requested_new_estimation_queue = estimationOwnedPharmacy.customer_requested_new_estimation_queue;
      customer_requested_new_estimation_queue.push(requirementsChangedEstimation._id);
      Pharmacy.updateOne({
        _id: requirementsChangedEstimation.supplier_id
      }, {
        $set: {
          customer_requested_new_estimation_queue: customer_requested_new_estimation_queue
        }
      }).then(changedSupplier => {
        console.log("customer_requested_new_estimation_queue updated");
        console.log(changedSupplier);
        PharmacyOrder.findOne({
          order_id_by_us: requirementsChangedEstimation.order_id
        }).then(myorder => {
          newRequiremntsRequestedOrder = myorder;
          console.log(newRequiremntsRequestedOrder);
          var waiting_another_response_for_estimation = newRequiremntsRequestedOrder.waiting_another_response_for_estimation;
          waiting_another_response_for_estimation.push(requirementsChangedEstimation._id);
          var unanswered_estimation_nums_to_order = newRequiremntsRequestedOrder.unanswered_estimation_nums_to_order;
          var index = unanswered_estimation_nums_to_order.indexOf(requirementsChangedEstimation._id);
          if (index > -1) {
            unanswered_estimation_nums_to_order.splice(index, 1);
          }

          PharmacyOrder.updateOne({
            order_id_by_us: requirementsChangedEstimation.order_id
          }, {
            $set: {
              unanswered_estimation_nums_to_order: unanswered_estimation_nums_to_order,
              waiting_another_response_for_estimation: waiting_another_response_for_estimation
            }
          }).then(updatedOrder => {
            console.log(updatedOrder);
            console.log("unanswered_estimation_nums_to_order & waiting_another_response_for_estimation changed");
            res.status(200).json({
              message: "send new estimation required request to pharmacy"
            });

          }).catch(error => {
            console.log(error);
          });

        }).catch(error => {
          console.log(error);
        });
      }).catch(error => {
        console.log(error);
      });
    }).catch(error => {
      console.log(error);
    });

  }).catch(error => {
    console.log(error);
  });
};
