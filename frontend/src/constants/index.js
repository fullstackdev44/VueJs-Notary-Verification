import _ from "lodash";
import UserTypes from "./user-types";
import MessageStatus, { MessageStatusToColor } from "./message-status";
import { TaskStatus, TaskStatusToColor } from "./task-status";
import HistoryType from "./history-type";
import { BatchStatus, BatchStatusToColor } from "./batch-status";
import EmailProvider from "./email-provider";
import EmailAuthStatus, { EmailAuthStatusToColor } from "./email-auth-status";

export const getOptions = (enumV) => _.map(enumV, (value, label) => ({ value, label }));

const UserTypeOptions = getOptions(UserTypes);
const EmailProviderOptions = Object.values(EmailProvider);

const constants = {
  UserTypes,
  UserTypeOptions,
  MessageStatus,
  MessageStatusToColor,
  TaskStatus,
  TaskStatusToColor,
  HistoryType,
  BatchStatus,
  BatchStatusToColor,
  EmailProvider,
  EmailProviderOptions,
  EmailAuthStatus,
  EmailAuthStatusToColor,
};
export default constants;
