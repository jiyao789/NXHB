"use strict";
const pointsApi = require("../../../api/points");
const tokenMod = require("../../../utils/token");

const PAGE_SIZE = 10;

function monthStrFromYmd(ymd) {
    if (!ymd || typeof ymd !== "string") {
        return "";
    }
    const p = ymd.trim().split("-");
    if (p.length < 2) {
        return "";
    }
    const y = p[0];
    const m = parseInt(p[1], 10);
    return `${y}年${m}月`;
}

function decorateRows(rows) {
    const list = Array.isArray(rows) ? rows : [];
    return list.map((row) => {
        const bizDate = row && row.bizDate ? String(row.bizDate) : "";
        const dateDisp = bizDate.replace(/-/g, ".");
        const points = row && row.changeAmount != null ? row.changeAmount : 0;
        return {
            ledgerId: row && row.id != null ? String(row.id) : "",
            title: row && row.title ? row.title : "",
            date: dateDisp,
            points,
            monthStr: monthStrFromYmd(bizDate),
        };
    });
}

function applyMonthFlags(list) {
    return list.map((item, index, arr) => {
        let isNewMonth = false;
        if (index === 0) {
            isNewMonth = true;
        }
        else {
            const prev = arr[index - 1];
            if (item.monthStr !== prev.monthStr) {
                isNewMonth = true;
            }
        }
        return { ...item, isNewMonth };
    });
}

Page({
    data: {
        safeAreaInsetsTop: 20,
        tabs: ["全部", "已获取", "已消耗"],
        currentTab: 0,
        dataList: [],
        summaryData: {
            availablePoints: 0,
            totalPoints: 0,
        },
        firstLoaded: false,
        pageNo: 1,
        isEnd: false,
    },
    _listBusy: false,
    onLoad() {
        const sysInfo = wx.getSystemInfoSync();
        this.setData({ safeAreaInsetsTop: sysInfo.statusBarHeight || 20 });
        if (!tokenMod.tokenManager.getToken()) {
            wx.showToast({ title: "请先登录", icon: "none" });
            setTimeout(() => wx.navigateBack(), 1200);
            return;
        }
        void this.queryList(1);
    },
    handleBack() {
        wx.navigateBack();
    },
    switchTab(e) {
        const index = parseInt(e.currentTarget.dataset.index, 10);
        if (index === this.data.currentTab || Number.isNaN(index)) {
            return;
        }
        this.setData({
            currentTab: index,
            pageNo: 1,
            isEnd: false,
            dataList: [],
            firstLoaded: false,
        });
        void this.queryList(1);
    },
    loadMore() {
        if (this.data.isEnd || this._listBusy) {
            return;
        }
        const nextPage = this.data.pageNo + 1;
        this.setData({ pageNo: nextPage });
        void this.queryList(nextPage);
    },
    async queryList(pageNo) {
        if (this._listBusy) {
            return;
        }
        if (!tokenMod.tokenManager.getToken()) {
            return;
        }
        this._listBusy = true;
        wx.showNavigationBarLoading({});
        try {
            const tabType = this.data.currentTab;
            const query = {
                current: pageNo,
                size: PAGE_SIZE,
                type: tabType,
            };
            let pageRes;
            if (pageNo === 1) {
                const [pRes, sum] = await Promise.all([
                    pointsApi.getPointsLedgerPageApi(query),
                    pointsApi.getPointsLedgerSummaryApi(),
                ]);
                pageRes = pRes;
                this.setData({
                    summaryData: {
                        availablePoints: sum && sum.availablePoints != null ? sum.availablePoints : 0,
                        totalPoints: sum && sum.totalEarnedPoints != null ? sum.totalEarnedPoints : 0,
                    },
                });
            }
            else {
                pageRes = await pointsApi.getPointsLedgerPageApi(query);
            }
            const rawRows = pageRes && Array.isArray(pageRes.records) ? pageRes.records : [];
            const newList = decorateRows(rawRows);
            const combinedList = applyMonthFlags(pageNo === 1 ? newList : this.data.dataList.concat(newList));
            this.setData({
                dataList: combinedList,
                firstLoaded: true,
                isEnd: rawRows.length < PAGE_SIZE,
            });
        }
        catch (e) {
            console.error("[integral]", e);
            this.setData({ firstLoaded: true });
        }
        finally {
            this._listBusy = false;
            wx.hideNavigationBarLoading();
        }
    },
});
