import { http as request } from '../utils/http.js';

/**
 * 获取组织机构树选择器 (街道列表)
 */
export function getOrgTreeSelector() {
  return request({
    url: '/sys/org/orgTreeSelector',
    method: 'GET'
  });
}
