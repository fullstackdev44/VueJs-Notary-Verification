import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import _ from 'lodash';
import morgan from 'morgan';
// const utils = require("./server/middleware/utils");

const redisClient = require('redis').createClient()
const fs = require('fs')
const moment = require('moment');
const os = require('os');
const socketio = require('socket.io');
import * as Limiter from "./server/middleware/ratelimiter";
import mongoose from 'mongoose'
import path from 'path';

dotenv.config();

const app = express();
const cron = require('node-cron');
const controller = require('./server/controllers/api');
const adminController = require('./server/controllers/admins');
const services = require('./server/service/AlertingService')
// const CustomService = require('./server/service/CustomService')
const VendorService = require('./server/service/VendorService')
// console.log(controller)
// console.log(services)

const xmlparser = require('express-xml-bodyparser');

require('./server/config/mongo')();

if (process.env.VIDEO_PROCESSING_SERVER === '1') {
	cron.schedule('*/2 * * * *', () => {
		// controller.pdfEditsVideoDocumentSaveSecondaryServer()
		// controller.pdfEditsVideoDocumentSaveSecondaryServerNewLogic()
		controller.pdfEditsVideoDocumentSaveSecondaryServerOpenViduLogic()
	});
} else if (process.env.SOCKET_SERVER === '1') {
	let videoSavingDir;
	if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging') {
		const homeDir = os.homedir();
		videoSavingDir = `${homeDir}/repo/bluenotaryapp/backend/tmp`;
	} else {
		videoSavingDir = './tmp';
	}
	if (!fs.existsSync(videoSavingDir)) {
		fs.mkdirSync(videoSavingDir);
	}
	console.log(`Video Stream dir: ${videoSavingDir}`);
	const UserActivityLogs = require('./server/models/userActivityLogs');
	const SessionUserLogs = require('./server/models/sessionUserLogs');
	const SessionStatModel = require('./server/models/sessionstat');
	const sockerServerPort = 3001;
	const server = app.listen(sockerServerPort, () => {
		console.log('server listening at', server.address())
	})
	console.log(`Socker Server running on ${sockerServerPort}`);
	const io = socketio(server, {
		path: '/default_socket/'
	})
	const videoio = socketio(server, {
		path: '/video_stream_sock/'
	})

	redisClient.connect().then(() => {
		io.on('connection', (socket) => {
			socket.on('initialize', (req) => {
				const userId = req.user
				const userSocketMapKey = 'usersocket_' + String(socket.id)
				redisClient.set(userSocketMapKey, String(userId), (err, newPrefix) => {
					// Expire this socket relation map after 6 hours, as most probably the socket id would have been changed
					redisClient.expire(userSocketMapKey, 21600, (err1, result) => {
						if (err1) {
							console.log(err1)
						}
					})
				})
			});
			socket.on('join_user', async (req) => {
				const userId = req.user;
				const socketRoomName = 'USER_' + String(userId);
				await socket.join(socketRoomName);
				if (req.dashboard) {
					await socket.join('USER_DASHBOARD');
				}
			});
			socket.on('leave_user', async (req) => {
				const userId = req.user;
				const socketRoomName = 'USER_' + String(userId);
				await socket.leave(socketRoomName);
				if (req.dashboard) {
					await socket.leave('USER_DASHBOARD');
				}
			});
			socket.on('join_session', async (req) => {
				try {
					const sessionid = req.sessionid;
					const socketRoomName = 'SESSION_' + String(sessionid);
					await socket.join(socketRoomName);
					const now = Date.now();
					const userId = req.user
					const sessionDurationKey = `${sessionid}_${userId}_session_joined_at`;
					console.log('userId', userId)
					io.to(socket.id).emit('updates', {
						event: 'join_success',
						userId,
						sessionid
					});
					const socketIds = _.map(await io.in(socketRoomName).fetchSockets(), 'id');
					const redisSocketKeys = _.map(socketIds, (sockid) => {
						return 'usersocket_' + sockid
					})
					if (!redisSocketKeys.length) {
						redisSocketKeys.push('usersocket_' + String(socket.id))
					}
					const userIds = await redisClient.mGet(redisSocketKeys) || []
					const finalUserIds = _.compact(_.uniq(userIds));
					if (finalUserIds.indexOf(userId) === -1) {
						finalUserIds.push(userId)
					}
					console.log('finalUserIds', finalUserIds)
					const dataToSend = {
						event: 'current_session_users',
						userId,
						sessionid,
						finalUserIds
					}
					io.in(socketRoomName).emit('updates', dataToSend);
					const sessionUserLogsData = new SessionUserLogs({
						sessionid: new mongoose.Types.ObjectId(sessionid),
						userId: new mongoose.Types.ObjectId(userId),
						actionType: 'join_session',
						createdAt: new Date(),
						updatedAt: new Date()
						// ip: utils.getIP(req),
						// browser: utils.getBrowserInfo(req),
						// country: utils.getCountry(req),
					});
					sessionUserLogsData.save();
					await services.startSessionAlertingService(sessionid, userId, io)
					await VendorService.sendVendorUpdatesIntermediate('join_session',
						'User has joined the session', {_id: userId}, sessionid, false)
					redisClient.set(sessionDurationKey, now, (err, reply) => {
						if (err) {
							console.log(err);
						} else {
							redisClient.expire(sessionDurationKey, 21600, (err1, reply1) => {
								if (err) {
									console.log('Failed to set session expiry', err);
								}
							})
						}
					})
				} catch (err) {
					console.log(err);
				}
			});
			socket.on('leave_session', async (req) => {
				try {
					const sessionid = req.sessionid;
					const socketRoomName = 'SESSION_' + String(sessionid);
					await socket.leave(socketRoomName);
					const userId = req.user
					console.log('socketRoomName LEAVE CALLED', socketRoomName)
					const socketIds = _.map(await io.in(socketRoomName).fetchSockets(), 'id');
					const redisSocketKeys = _.map(socketIds, (sockid) => {
						return 'usersocket_' + sockid
					})
					console.log('sleave', redisSocketKeys)
					if (redisSocketKeys.length) {
						const userIds = await redisClient.mGet(redisSocketKeys)
						const finalUserIds = _.compact(_.uniq(userIds));
						console.log('sleave userids', finalUserIds)
						const dataToSend = {
							event: 'current_session_users',
							userId,
							sessionid,
							finalUserIds
						}
						console.log('sleave dataToSend', dataToSend)
						io.in(socketRoomName).emit('updates', dataToSend);
					}
					const sessionUserLogsData = new SessionUserLogs({
						sessionid: new mongoose.Types.ObjectId(sessionid),
						userId: new mongoose.Types.ObjectId(userId),
						actionType: 'leave_session',
						createdAt: new Date(),
						updatedAt: new Date()
						// ip: utils.getIP(req),
						// browser: utils.getBrowserInfo(req),
						// country: utils.getCountry(req),
					});
					const sessionStat = await SessionStatModel.findOne({sessionId: sessionid});
					if (sessionStat) {
						await SessionStatModel.findOneAndUpdate({
							sessionId: sessionid
						}, {
							'notaryStat.waitingRoom': 'Left the room',
							'notaryStat.videoCam': 'Off',
							'notaryStat.recordingStatus': 'Stopped',
							'notaryStat.recordingStartedAt': 0,
							'notaryStat.recordingTimeInSecs': 0,
							'notaryStat.completePendingItems': '',
							'customerStat.videoCam': 'Off',
							'customerStat.waitingRoom': 'Left the room'
						}, {
							upsert: true
						})
					}
					const sessionDurationKey = `${String(sessionid)}_${String(userId)}_session_joined_at`;
					redisClient.del(sessionDurationKey, (err, rpl) => {
						if (err) {
							console.log(err);
						}
					});
					sessionUserLogsData.save();
					await VendorService.sendVendorUpdatesIntermediate('leave_session',
						'User has left the session', {_id: userId}, sessionid, false)
				} catch (err) {
					console.log(err)
				}
			});
			socket.on('session_recording_started', async (req) => {
				const userId = req.user
				const sessionid = String(req.sessionid);
				await SessionStatModel.findOneAndUpdate({
						sessionId: sessionid
					}, {
						'notaryStat.recordingStatus': 'Started',
						'notaryStat.recordingStartedAt': new Date().getTime()
					}, {
						upsert: true
					}
				);
				await VendorService.sendVendorUpdatesIntermediate('session_started',
					'Session Recording has started', {_id: userId}, sessionid, false)
			});
			socket.on('session_terminated', (req) => {
				try {
					const sessionid = req.sessionid;
					const socketRoomName = 'SESSION_' + String(sessionid);
					const userId = req.user
					const dataToSend = {
						event: 'session_terminated',
						userId,
						sessionid
					}
					socket.to(socketRoomName).emit('updates', dataToSend);
					const sessionUserLogsData = new SessionUserLogs({
						sessionid: new mongoose.Types.ObjectId(sessionid),
						userId: new mongoose.Types.ObjectId(userId),
						actionType: 'session_terminated',
						createdAt: new Date(),
						updatedAt: new Date()
						// ip: utils.getIP(req),
						// browser: utils.getBrowserInfo(req),
						// country: utils.getCountry(req),
					});
					sessionUserLogsData.save();
					services.endSessionAlertingService(sessionid, userId, io)
				} catch (err) {
					console.log(err)
				}
			});
			socket.on('session_completed', (req) => {
				try {
					const sessionid = req.sessionid;
					const socketRoomName = 'SESSION_' + String(sessionid);
					const userId = req.user
					const dataToSend = {
						event: 'session_completed',
						userId,
						sessionid
					}
					console.log('dataToSend', dataToSend)
					socket.to(socketRoomName).emit('updates', dataToSend);
					const sessionUserLogsData = new SessionUserLogs({
						sessionid: new mongoose.Types.ObjectId(sessionid),
						userId: new mongoose.Types.ObjectId(userId),
						actionType: 'session_completed',
						createdAt: new Date(),
						updatedAt: new Date()
						// ip: utils.getIP(req),
						// browser: utils.getBrowserInfo(req),
						// country: utils.getCountry(req),
					});
					sessionUserLogsData.save();
					services.endSessionAlertingService(sessionid, userId, io)
				} catch (err) {
					console.log(err)
				}
			});
			socket.on('session_completed_payment_failed', (req) => {
				try {
					const sessionid = req.sessionid;
					const socketRoomName = 'SESSION_' + String(sessionid);
					const userId = req.user
					const dataToSend = {
						event: 'session_completed_payment_failed',
						userId,
						sessionid
					}
					console.log('dataToSend', dataToSend)
					socket.to(socketRoomName).emit('updates', dataToSend);
					const sessionUserLogsData = new SessionUserLogs({
						sessionid: new mongoose.Types.ObjectId(sessionid),
						userId: new mongoose.Types.ObjectId(userId),
						actionType: 'session_completed',
						createdAt: new Date(),
						updatedAt: new Date()
						// ip: utils.getIP(req),
						// browser: utils.getBrowserInfo(req),
						// country: utils.getCountry(req),
					});
					sessionUserLogsData.save();
					services.endSessionAlertingService(sessionid, userId, io)
				} catch (err) {
					console.log(err)
				}
			});
			socket.on('kba_status_changed', (req) => {
				const sessionid = req.sessionid
				const userId = req.user
				const userType = req.userType
				const sectionName = req.sectionName
				const socketRoomName = 'SESSION_' + String(sessionid);
				const dataToSend = {
					event: 'kba_status_changed',
					userId,
					sessionid,
					userType,
					sectionName
				}
				socket.to(socketRoomName).emit('updates', dataToSend);
			});
			socket.on('dropped_field_updates', (req) => {
				const sessionid = req.sessionid
				const userId = req.user
				const updatedField = req.updatedField
				const socketRoomName = 'SESSION_' + String(sessionid);
				const dataToSend = {
					event: 'dropped_field_updates',
					userId,
					sessionid,
					updatedField
				}
				socket.to(socketRoomName).emit('updates', dataToSend);
			});
			socket.on('partial_dropped_field_updates', (req) => {
				const sessionid = req.sessionid
				const userId = req.user
				const partialUpdatedField = req.partialUpdatedField
				const socketRoomName = 'SESSION_' + String(sessionid);
				const dataToSend = {
					event: 'partial_dropped_field_updates',
					userId,
					sessionid,
					partialUpdatedField
				}
				socket.to(socketRoomName).emit('updates', dataToSend);
			});
			socket.on('video_capture_started', (req) => {
				const sessionid = req.sessionid
				const userId = req.user
				const socketRoomName = 'SESSION_' + String(sessionid);
				const dataToSend = {
					event: 'video_capture_started',
					userId,
					sessionid
				}
				socket.to(socketRoomName).emit('updates', dataToSend);
			});
			socket.on('video_capture_stopped', (req) => {
				const sessionid = req.sessionid
				const userId = req.user
				const socketRoomName = 'SESSION_' + String(sessionid);
				const dataToSend = {
					event: 'video_capture_stopped',
					userId,
					sessionid
				}
				socket.to(socketRoomName).emit('updates', dataToSend);
			});
			socket.on('session_completion_started', (req) => {
				try {
					const sessionid = req.sessionid
					const userId = req.user
					const socketRoomName = 'SESSION_' + String(sessionid);
					const dataToSend = {
						event: 'session_completion_started',
						userId,
						sessionid
					}
					console.log('session_completion_started')
					const sessionUserLogsData = new SessionUserLogs({
						sessionid: new mongoose.Types.ObjectId(sessionid),
						userId: new mongoose.Types.ObjectId(userId),
						actionType: 'session_completed_clicked',
						createdAt: new Date(),
						updatedAt: new Date()
					});
					sessionUserLogsData.save();
					socket.to(socketRoomName).emit('updates', dataToSend);
				} catch (error) {
					console.log(error)
				}
			});
			socket.on('session_completion_finished', (req) => {
				try {
					const sessionid = req.sessionid
					const userId = req.user
					const socketRoomName = 'SESSION_' + String(sessionid);
					const dataToSend = {
						event: 'session_completion_finished',
						userId,
						sessionid
					}
					socket.to(socketRoomName).emit('updates', dataToSend);
				} catch (error) {
					console.log(error)
				}
			});
			socket.on('new_session_open_call', (req) => {
				try {
					const sessionid = req.sessionid
					const userId = req.user
					const socketRoomName = 'USER_DASHBOARD'
					const dataToSend = {
						event: 'new_session_open_call',
						userId,
						sessionid
					}
					io.in(socketRoomName).emit('updates', dataToSend);
				} catch (error) {
					console.log(error)
				}
			});
			socket.on('new_session_witness_open_call', (req) => {
				try {
					const sessionid = req.sessionid
					const userId = req.user
					const socketRoomName = 'USER_DASHBOARD'
					const dataToSend = {
						event: 'new_session_witness_open_call',
						userId,
						sessionid
					}
					io.in(socketRoomName).emit('updates', dataToSend);
				} catch (error) {
					console.log(error)
				}
			});
			socket.on('full_session_fields', (req) => {
				const sessionid = req.sessionid
				const userId = req.user
				const fullFields = req.fullFields
				const emptyPagesAdded = req.emptyPagesAdded
				const socketRoomName = 'SESSION_' + String(sessionid);
				const dataToSend = {
					event: 'full_session_fields',
					userId,
					sessionid,
					fullFields,
					emptyPagesAdded
				}
				socket.to(socketRoomName).emit('updates', dataToSend);
			});
			socket.on('custom_charges_modified_sent_for_approval', (req) => {
				const sessionid = req.sessionid
				const userId = req.user
				const customChargesEditValues = req.customChargesEditValues
				const socketRoomName = 'SESSION_' + String(sessionid);
				const dataToSend = {
					event: 'custom_charges_modified_sent_for_approval',
					userId,
					sessionid,
					customChargesEditValues
				}
				socket.to(socketRoomName).emit('updates', dataToSend);
			});
			socket.on('custom_charges_modified_approval_updates', (req) => {
				const sessionid = req.sessionid
				const userId = req.user
				const customChargesEditValues = req.customChargesEditValues
				const customChargesEditValuesApprovalValue = req.customChargesEditValuesApprovalValue
				const socketRoomName = 'SESSION_' + String(sessionid);
				const dataToSend = {
					event: 'custom_charges_modified_approval_updates',
					userId,
					sessionid,
					customChargesEditValues,
					customChargesEditValuesApprovalValue
				}
				socket.to(socketRoomName).emit('updates', dataToSend);
			});
			socket.on('custom_charges_modified', (req) => {
				const sessionid = req.sessionid
				const userId = req.user
				const customChargesEditValues = req.customChargesEditValues
				const customChargesModified = req.customChargesModified
				const socketRoomName = 'SESSION_' + String(sessionid);
				const dataToSend = {
					event: 'custom_charges_modified',
					userId,
					sessionid,
					customChargesEditValues,
					customChargesModified
				}
				socket.to(socketRoomName).emit('updates', dataToSend);
			});
			socket.on('new_page_added', (req) => {
				const sessionid = req.sessionid
				const userId = req.user
				const socketRoomName = 'SESSION_' + String(sessionid);
				const dataToSend = {
					event: 'new_page_added',
					userId,
					sessionid
				}
				socket.to(socketRoomName).emit('updates', dataToSend);
			});
			socket.on('session_witness_management_changed', (req) => {
				const sessionid = req.sessionid
				const userId = req.user
				const socketRoomName = 'SESSION_' + String(sessionid);
				const dataToSend = {
					event: 'session_witness_management_changed',
					userId,
					sessionid
				}
				socket.to(socketRoomName).emit('updates', dataToSend);
			});
			socket.on('session_witness_removed', (req) => {
				const sessionid = req.sessionid
				const userId = req.user
				const removedUserId = req.removedUserId
				const socketRoomName = 'SESSION_' + String(sessionid);
				const dataToSend = {
					event: 'session_witness_removed',
					userId,
					sessionid,
					removedUserId
				}
				socket.to(socketRoomName).emit('updates', dataToSend);
			});
			socket.on('manually_fetch_session_data', (req) => {
				const sessionid = req.sessionid
				const userId = req.user
				const socketRoomName = 'SESSION_' + String(sessionid);
				const dataToSend = {
					event: 'manually_fetch_session_data',
					userId,
					sessionid
				}
				socket.to(socketRoomName).emit('updates', dataToSend);
			});
			socket.on('manually_refresh_session_data', (req) => {
				const sessionid = req.sessionid
				const userId = req.user
				const socketRoomName = 'SESSION_' + String(sessionid);
				const dataToSend = {
					event: 'manually_refresh_session_data',
					userId,
					sessionid
				}
				socket.to(socketRoomName).emit('updates', dataToSend);
			});
			socket.on('current_selected_document_changed', (req) => {
				const sessionid = req.sessionid
				const userId = req.user
				const currentSelectedDocumentId = req.currentSelectedDocumentId
				const socketRoomName = 'SESSION_' + String(sessionid);
				const dataToSend = {
					event: 'current_selected_document_changed',
					userId,
					sessionid,
					currentSelectedDocumentId
				}
				socket.to(socketRoomName).emit('updates', dataToSend);
			});
			socket.on('serverSessionActivityChanged', async (req) => {
				const sessionid = req.sessionid
				const dataToSend = {
					event: 'sessionActivityChanged',
					sessionid
				}
				console.log(dataToSend)
				io.sockets.emit('updates', dataToSend);
			});
			socket.on('getActiveNotaryList', async (req) => {
				console.log('getActiveNotaryList')
				const activeUserIds = await redisClient.KEYS('active_userid_*')
				console.log('activeUserIds', activeUserIds)
				const dataToSend = {
					event: 'getActiveNotaryListOutput',
					count: activeUserIds.length
				}
				socket.emit('updates', dataToSend)
			});
			socket.on('connection_active', async (req) => {
				const user = req.user
				const url = req.url
				const userrole = req.userrole
				const memberType = req.memberType
				if (userrole === 'notary' && memberType !== 'free') {
					const userSocketMapKey = 'active_userid_' + String(user)
					const resp = await redisClient.set(userSocketMapKey, url)
					const expireResp = await redisClient.EXPIRE(userSocketMapKey, 150)
					console.log('resp, expireResp', resp, expireResp)
				}
				const userActivityLogsData = new UserActivityLogs({
					userId: new mongoose.Types.ObjectId(user),
					url
				});
				userActivityLogsData.save();
			});
			socket.on('session_heartbeat', async (req) => {
				try {
					const sessionId = req.sessionid;
					const userId = req.user;
					const lastActiveKey = `${sessionId}_${userId}_session_last_active`;
					const joinedAsPrimarySigner = req.joinedAsPrimarySigner || false;
					const joinedAsSessionNotary = req.joinedAsSessionNotary || false;
					if (joinedAsSessionNotary || joinedAsPrimarySigner) {
						console.log('session_heartbeat');
						console.log(lastActiveKey);
						const currentTs = Date.now();
						redisClient.set(lastActiveKey, currentTs, (err1, rpl1) => {
							if (err1) {
								console.log(err1);
							}
						})
					}
				} catch (err) {
					console.log(err);
				}
			});
			socket.on('reload_user_session', async (req) => {
				const sessionId = String(req.sessionid);
				const dataToSend = {
					sessionid: sessionId,
					event: 'reload_user_session',
					role: req.role
				}
				console.log('reload_user_session', dataToSend);
				const socketRoomName = `SESSION_${sessionId}`;
				socket.to(socketRoomName).emit('updates', dataToSend);
			});
		})
		videoio.on('connection', (videoSocket) => {
			videoSocket.on('pdf_video_session_stream', async (req) => {
				const sessionid = req.sessionid
				const blob = req.blob
				const user = req.user
				const joinedAsSessionNotary = req.joinedAsSessionNotary || false;
				if (joinedAsSessionNotary) {
					const now = moment(Date.now());
					const recordingStartedAt = moment(req.timestamp);
					const totalSeconds = now.diff(recordingStartedAt, 'seconds');
					const sessionStat = await SessionStatModel.findOne({sessionId: sessionid});
					if (sessionStat && sessionStat.notaryStat !== undefined) {
						await SessionStatModel.updateOne({_id: sessionStat._id}, {
							'notaryStat.recordingTimeInSecs': totalSeconds
						})
					}
				}
				const rt = req.recordertype
				console.log('Received video stream');
				console.log(blob);
				console.log(req);
				fs.appendFile(videoSavingDir + '/SESSION_VIDEO_' + sessionid + '_' + String(user)
					+ ((rt === undefined) ? ((!joinedAsSessionNotary) ? '_T' : '_BNT') + req.timestamp : ('_' + rt))
						+ '.webm', blob, (err) => {
					if (err) { throw err; }
					console.log('Chunck Saved!', String(user));
				})
			});
		})
	})
	module.exports = app;
} else if (process.env.ONE_TIME_ACTIVITY === '1') {
	// controller.signAllDocumentsWeekly()
	// controller.sendZigTestRequest()
	// controller.regerateAllFollowupDocuments()

	const ProfileService = require('./server/service/ProfileService')
	ProfileService.generateAllProfiles()
	console.log('profile service called')

	// CustomService.generateNotarySealsForRemainingNotaries()
	// controller.generateBuyDCForOneUser('rohit1@mailinator.com')
	// CustomService.generateNotarySealsPNGForRemainingNotaries()
} else {
	redisClient.connect();
	let serverPort = 5000;
	if (process.argv[2]) {
		serverPort = parseInt(process.argv[2], 10);
	}
	console.log(`API Server running on ${serverPort}`);
	app.set('port', serverPort);
	app.use(morgan('dev'));
	app.use(
		bodyParser.json({
			limit: '20mb'
		})
	);
	app.use(
		bodyParser.urlencoded({
			limit: '20mb',
			extended: true
		})
	);
	app.use(xmlparser());
	app.use(bodyParser.raw({ type: 'application/json' }));
	app.use(bodyParser.raw({ type: 'application/xml' }));
	app.use(cors());
	app.use(compression());
	app.use(helmet());
	app.use(express.static('public'));
	app.use('public', express.static(__dirname + 'public'));
	app.set('views', path.join(__dirname, 'views'));
	app.engine('html', require('ejs').renderFile);
	app.set('view engine', 'html');
	app.use('/api/auth/login', require('./server/routes/auth'),Limiter.LoginLimit(redisClient));
	app.use('/api/auth/register', require('./server/routes/auth'),Limiter.SignupLimit(redisClient));
	app.use('/api', require('./server/routes'),Limiter.GlobalLimit(redisClient));
	app.listen(app.get('port'), '0.0.0.0');
	process.setMaxListeners(0);

	cron.schedule('0 */24 * * *', () => {
	  console.log('Running a cron every 24 hour');
	  // after 24hrs, if no update, remove document and set the session status to "expired"
	  // controller.checkExpiredDocument();
	  // after 1 day, status is not completed  remove document and set the session status to "expired"
	  controller.checkExpiredSession();
	});
	// task.start();
	cron.schedule('30 7 * * *', () => {
		controller.checkExpiredCommissionLetter();
	});

	cron.schedule('*/10 * * * *', () => {
		controller.checkForSessionsInNextHourAndSendReminderEmail();
	});

	// cron.schedule('*/10 * * * *', () => {
	// 	controller.checkForSessionsForWhichSessionTimeHasPassedAndSessionNotDone();
	// });
	cron.schedule('*/59 * * * *', () => {
		adminController.precomputeOnboardingStatusOfNotaries();
	});
	cron.schedule('30 7 * * SAT', () => {
		controller.signAllDocumentsWeekly()
		setTimeout(() => {
			const ProfileService = require('./server/service/ProfileService')
			ProfileService.generateAllProfiles()
			console.log('profile service called')
		}, 300000)
	});
	module.exports = app
}
