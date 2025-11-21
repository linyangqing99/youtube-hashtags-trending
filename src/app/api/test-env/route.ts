/**
 * 环境变量配置测试接口
 * 用于验证环境变量是否正确配置
 */

import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.YOUTUBE_API_KEY;
  const httpsProxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  const httpProxy = process.env.HTTP_PROXY || process.env.http_proxy;
  const allProxy = process.env.ALL_PROXY || process.env.all_proxy;

  return NextResponse.json({
    success: true,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'not-set',
      proxySettings: {
        hasHttpsProxy: !!httpsProxy,
        hasHttpProxy: !!httpProxy,
        hasAllProxy: !!allProxy,
        httpsProxy: httpsProxy ? `${httpsProxy.split(':')[0]}:${httpsProxy.split(':')[1]}` : 'not-set',
        httpProxy: httpProxy ? `${httpProxy.split(':')[0]}:${httpProxy.split(':')[1]}` : 'not-set',
        allProxy: allProxy ? `${allProxy.split(':')[0]}:${allProxy.split(':')[1]}` : 'not-set',
      }
    },
    status: apiKey ? 'configured' : 'missing-api-key',
    recommendations: {
      apiConfigured: !!apiKey,
      proxyConfigured: !!(httpsProxy || httpProxy || allProxy),
      readyForTesting: !!apiKey && (!!(httpsProxy || httpProxy || allProxy) || process.env.NODE_ENV === 'production')
    }
  });
}