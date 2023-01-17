import _ from 'lodash';
import { NewSessionModel } from '../models/newsessiondata';
const Vendors = require('../models/vendors');
const User = require('../models/user');
const request = require('request');

export const sendVendorUpdates = async (vendorDoc, sessionDoc, eventType, eventDetails, eventByUserDoc) => {
	if (!vendorDoc) {
    return
  }
 const url = vendorDoc?.updatesAPIWebhookDetails?.url
 if (!url) {
    return
  }
 const headers = vendorDoc?.updatesAPIWebhookDetails?.headers || {}
 const dataToSend = {
    notarization_id: sessionDoc.notarizationId,
    bn_session_id: sessionDoc._id,
    event_type: eventType,
    event_details: eventDetails,
    event_by_details: {
      first_name: eventByUserDoc.first_name,
      middle_name: eventByUserDoc.middle_name,
      last_name: eventByUserDoc.last_name,
      email: eventByUserDoc.email
    }
}
 request({
    url,
    method: 'POST',
    body: dataToSend,
    headers,
    json: true
  }, (error2, response2, body2) => {
    console.log('error2', error2)
    // console.log('response2', response2)
    console.log('body2', body2)
  });
};

export const sendVendorUpdatesIntermediate = async (eventType, eventMessage, userDoc, sessionid, sessionDoc) => {
	if (!userDoc) {
		return
	}
	if (!sessionDoc) {
		sessionDoc = await NewSessionModel.findOne({
			_id: sessionid
		})
	}
	if (!sessionDoc?.vendor) {
		return
	}
	const vendorDoc = await Vendors.findOne({
		_id: sessionDoc.vendor,
		deleted: {$ne: true}
	})
	if (!vendorDoc) {
		return
	}
	const eventDetails = {
		message: eventMessage
	}
	let userDocToSend = userDoc
	if (!userDocToSend.name) {
		userDocToSend = await User.findOne({
			_id: userDoc._id
		})
	}
	sendVendorUpdates(vendorDoc, sessionDoc, eventType, eventDetails, userDocToSend)
};
