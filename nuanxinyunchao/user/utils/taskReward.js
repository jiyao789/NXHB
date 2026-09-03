"use strict";
const task_1 = require("../api/task");

/**
 * 提交每日任务完成并领取积分
 * @param {{taskCode?:string, taskId?:number|string, taskUrl?:string}} opts
 */
function submitTaskReward(opts) {
  const o = opts && typeof opts === "object" ? opts : { taskCode: opts };
  const taskCode = o.taskCode != null ? String(o.taskCode).trim() : "";
  const taskId = o.taskId != null && String(o.taskId).trim() !== "" ? String(o.taskId).trim() : "";
  const taskUrl = o.taskUrl != null ? String(o.taskUrl).trim() : "";
  if (!taskCode && !taskId && !taskUrl) {
    return Promise.resolve({ awarded: false, pointsGranted: 0, message: "缺少任务标识" });
  }
  const payload = {};
  if (taskCode) payload.taskCode = taskCode;
  if (taskId) payload.taskId = taskId;
  if (taskUrl) payload.taskUrl = taskUrl;

  return task_1
    .completeTaskApi(payload)
    .then((res) => {
      const body = res && (res.awarded != null || res.pointsGranted != null || res.message) ? res : {};
      return {
        awarded: !!body.awarded,
        pointsGranted: body.pointsGranted != null ? Number(body.pointsGranted) : 0,
        message: body.message || ""
      };
    })
    .catch((e) => {
      const msg = (e && (e.message || e.msg)) || "领取积分失败";
      wx.showToast({ title: msg, icon: "none", duration: 2800 });
      return { awarded: false, pointsGranted: 0, message: msg };
    });
}

function showTaskRewardToast(result) {
  if (!result) return;
  if (result.awarded && result.pointsGranted > 0) {
    wx.showToast({ title: `+${result.pointsGranted}积分`, icon: "none" });
  } else if (result.message) {
    wx.showToast({ title: result.message, icon: "none", duration: 2800 });
  }
}

/** 历史库内 task/* 相对路径 → 小程序分包页面 */
const TASK_PATH_ALIASES = {
  "task/video": "/nuanxinyunchao/user/pages-sub/index/occupation_video",
  "task/note": "/nuanxinyunchao/user/pages-sub/index/points/index",
  "task/course": "/nuanxinyunchao/user/pages-sub/index/points/index",
  "task/exam": "/nuanxinyunchao/user/pages-sub/index/points/index",
  "task/discussion": "/nuanxinyunchao/user/pages-sub/index/volunteer/index"
};

function getActiveTask() {
  const raw = wx.getStorageSync("activeTask");
  return raw && typeof raw === "object" ? raw : null;
}

/** 合并更新 activeTask，保留 taskId / taskCode / taskUrl 等领奖标识 */
function persistActiveTask(patch) {
  const prev = getActiveTask() || {};
  if (!prev.active && !(patch && patch.active)) {
    return prev;
  }
  const merged = Object.assign({}, prev, patch || {});
  if (!merged.taskId && prev.taskId) merged.taskId = prev.taskId;
  if (!merged.taskCode && prev.taskCode) merged.taskCode = prev.taskCode;
  if (!merged.taskUrl && prev.taskUrl) merged.taskUrl = prev.taskUrl;
  if (merged.rewardSubmitted == null && prev.rewardSubmitted != null) {
    merged.rewardSubmitted = prev.rewardSubmitted;
  }
  wx.setStorageSync("activeTask", merged);
  return merged;
}

/** 页面 onHide 时保存倒计时与完成状态，不丢失领奖标识 */
function snapshotActiveTaskFromPage(taskInfo, countdown) {
  if (!taskInfo || !taskInfo.active) {
    return getActiveTask();
  }
  const patch = {
    active: true,
    type: taskInfo.type,
    isCompleted: !!taskInfo.isCompleted
  };
  if (countdown != null && countdown !== undefined) {
    patch.countdown = countdown;
  } else if (taskInfo.countdown != null) {
    patch.countdown = taskInfo.countdown;
  }
  return persistActiveTask(patch);
}

function markTaskCompletedAndClaim() {
  persistActiveTask({ isCompleted: true });
  return claimBrowseTaskReward();
}

function urlToTaskCode(rawUrl) {
  if (!rawUrl) return "";
  const u = String(rawUrl).trim().replace(/^\//, "").toLowerCase();
  if (TASK_PATH_ALIASES[u]) {
    return u.replace(/\//g, "_").toUpperCase();
  }
  if (u.startsWith("task/")) {
    return u.replace(/\//g, "_").toUpperCase();
  }
  return "";
}

/** 解析库内 taskUrl 为可跳转路径（必须以 /pages 开头） */
function resolveTaskPageUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  let u = raw.trim().replace(/^\//, "");
  const lower = u.toLowerCase();
  if (TASK_PATH_ALIASES[lower]) {
    return TASK_PATH_ALIASES[lower];
  }
  if (u.startsWith("nuanxinyunchao/")) {
    return "/" + u;
  }
  if (u.startsWith("pages")) {
    return "/nuanxinyunchao/user/" + u;
  }
  if (lower.includes("volunteer")) {
    return "/nuanxinyunchao/user/pages-sub/index/volunteer/index";
  }
  if (lower.includes("occupation_video") || lower.includes("video")) {
    return "/nuanxinyunchao/user/pages-sub/index/occupation_video";
  }
  if (lower.includes("points") || lower.includes("course") || lower.includes("exam")) {
    return "/nuanxinyunchao/user/pages-sub/index/points/index";
  }
  if (lower.includes("hot")) {
    return "/nuanxinyunchao/user/pages/hot/index";
  }
  if (lower.startsWith("task/")) {
    return "/nuanxinyunchao/user/pages-sub/index/points/index";
  }
  return "";
}

function buildActiveTaskPayload(task, pageUrl, browseMeta) {
  const rawUrl = (task && (task.raskUrl || task.taskUrl)) || pageUrl || "";
  const code = (task && task.code) || urlToTaskCode(rawUrl) || "";
  const id = task && task.taskId != null ? task.taskId : task && task.id != null ? task.id : "";
  return {
    active: true,
    type: browseMeta ? browseMeta.type : "",
    taskCode: code,
    taskId: id,
    taskUrl: rawUrl,
    countdown: browseMeta ? browseMeta.countdown : 0,
    isCompleted: false,
    rewardSubmitted: false
  };
}

/** 根据跳转路径推断浏览任务类型与倒计时 */
function inferBrowseTaskMeta(pageUrl) {
  const u = (pageUrl || "").toLowerCase();
  if (u.indexOf("/nuanxinyunchao/user/pages-sub/index/volunteer") >= 0) {
    return { type: "browse_volunteer", countdown: 10 };
  }
  if (u.indexOf("/nuanxinyunchao/user/pages/hot") >= 0) {
    return { type: "browse_hot", countdown: 15 };
  }
  if (u.indexOf("/nuanxinyunchao/user/pages-sub/index/points") >= 0) {
    return { type: "browse_points", countdown: 30 };
  }
  if (u.indexOf("/nuanxinyunchao/user/pages-sub/index/occupation_video") >= 0) {
    return { type: "watch_video", countdown: 30 };
  }
  return null;
}

/** 根据任务配置与跳转路径推断任务类型（不依赖标题硬编码） */
function resolveTaskMeta(task, pageUrl) {
  const rawUrl = (task && (task.raskUrl || task.taskUrl)) || "";
  const title = (task && task.title) || "";
  const code = (task && task.code) || urlToTaskCode(rawUrl) || "";
  const taskType = (task && task.taskType) || "";
  const blob = `${code} ${rawUrl} ${title} ${taskType}`.toLowerCase();
  const rawLower = rawUrl.toLowerCase().replace(/^\//, "");

  if (taskType === "SPECIAL" || blob.includes("邀请") || blob.includes("invite")) {
    return { type: "invite", countdown: 0 };
  }
  if (blob.includes("兑换") || blob.includes("coupon") || blob.includes("redeem") || blob.includes("exchange")) {
    return { type: "redeem_coupon", countdown: 0 };
  }
  if (
    blob.includes("video") ||
    rawLower === "task/video" ||
    (pageUrl && pageUrl.toLowerCase().includes("occupation_video"))
  ) {
    return { type: "watch_video", countdown: 30 };
  }

  let meta = inferBrowseTaskMeta(pageUrl);
  if (meta) {
    if (meta.type === "browse_hot" && blob.includes("兑换")) {
      return { type: "redeem_coupon", countdown: 0 };
    }
    return meta;
  }

  const resolved = resolveTaskPageUrl(rawUrl);
  meta = inferBrowseTaskMeta(resolved);
  if (meta) {
    if (meta.type === "browse_hot" && blob.includes("兑换")) {
      return { type: "redeem_coupon", countdown: 0 };
    }
    return meta;
  }

  if (rawLower === "task/discussion") {
    return { type: "browse_volunteer", countdown: 10 };
  }
  if (rawLower === "task/video") {
    return { type: "watch_video", countdown: 30 };
  }
  if (rawLower === "task/note" || rawLower === "task/course" || rawLower === "task/exam") {
    return { type: "browse_points", countdown: 30 };
  }

  if (pageUrl && (task && (task.taskId != null || task.id != null))) {
    return inferBrowseTaskMeta(pageUrl) || { type: "browse_points", countdown: 30 };
  }

  return null;
}

/** 浏览类任务倒计时结束后领取积分（防重复提交） */
function claimBrowseTaskReward() {
  const activeTask = getActiveTask();
  if (!activeTask || !activeTask.active || !activeTask.isCompleted || activeTask.rewardSubmitted) {
    return Promise.resolve(null);
  }
  if (!activeTask.taskCode && !activeTask.taskId && !activeTask.taskUrl) {
    wx.showToast({ title: "任务信息丢失，请返回报到页重试", icon: "none", duration: 2800 });
    return Promise.resolve({ awarded: false, pointsGranted: 0, message: "任务信息丢失" });
  }
  return submitTaskReward({
    taskCode: activeTask.taskCode,
    taskId: activeTask.taskId,
    taskUrl: activeTask.taskUrl
  }).then((result) => {
    persistActiveTask({ rewardSubmitted: true });
    showTaskRewardToast(result);
    return result;
  });
}

/** 兑换券任务：真实兑换成功后领取积分 */
function tryClaimRedeemTaskReward() {
  const activeTask = getActiveTask();
  if (!activeTask || !activeTask.active || activeTask.type !== "redeem_coupon" || activeTask.rewardSubmitted) {
    return Promise.resolve(null);
  }
  persistActiveTask({ isCompleted: true });
  return claimBrowseTaskReward();
}

module.exports = {
  submitTaskReward,
  showTaskRewardToast,
  getActiveTask,
  persistActiveTask,
  snapshotActiveTaskFromPage,
  markTaskCompletedAndClaim,
  resolveTaskPageUrl,
  urlToTaskCode,
  buildActiveTaskPayload,
  inferBrowseTaskMeta,
  resolveTaskMeta,
  claimBrowseTaskReward,
  tryClaimRedeemTaskReward
};
