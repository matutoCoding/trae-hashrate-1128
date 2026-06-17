export default defineAppConfig({
  pages: [
    'pages/schedule/index',
    'pages/standby/index',
    'pages/reconcile/index',
    'pages/discrepancy/index',
    'pages/settlement/index',
    'pages/settlement-detail/index',
    'pages/payment-workbench/index',
    'pages/studio-detail/index',
    'pages/booking-confirm/index',
    'pages/order-list/index',
    'pages/flow-detail/index',
    'pages/discrepancy-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#2563EB',
    navigationBarTitleText: '共享摄影棚',
    navigationBarTextStyle: 'white',
    backgroundColor: '#F1F5F9'
  },
  tabBar: {
    color: '#94A3B8',
    selectedColor: '#2563EB',
    backgroundColor: '#FFFFFF',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/schedule/index',
        text: '影棚排期'
      },
      {
        pagePath: 'pages/standby/index',
        text: '候补补位'
      },
      {
        pagePath: 'pages/reconcile/index',
        text: '双向对账'
      },
      {
        pagePath: 'pages/discrepancy/index',
        text: '差异处理'
      }
    ]
  }
})
