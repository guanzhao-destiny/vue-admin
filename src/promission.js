import router from './router'
// import { Message } from 'element-ui'
import axios from 'axios'
const _import = require('./router/_import_' + process.env.NODE_ENV) //获取组件的方法
import Layout from '@/views/layout' //Layout 是架构组件，不在后台返回，在文件里单独引入


var getRouter //用来获取后台拿到的路由

let data = {
  "router" : [
      {
        "name": "name.1",
        "sub_menu": [
            {
                "name": "name.1.1",
                "route": "admin/listing/list",
                "sub_menu": [
                    {
                        "name": "name.1.1.1",
                        "route": "admin/listing/list",
                        "method": "get"
                    }
                ]
            }
        ]
    },
    {
        "name": "name.2",
        "sub_menu": [
            {
                "name": "name.2.2",
                "route": "admin/get_menu",
                "method": "get"
            },
            {
                "name": "name.2.2.2",
                "route": "admin/get_menu",
                "method": "get"
            }
        ]
    }
  ]
}

// 假装fakeRouter是通过后台接口请求回来的数据
let fakeRouter = {
  "router": [{
      "path": "",
      "component": "Layout",
      "redirect": "dashboard",
      "children": [{
        "path": "dashboard",
        "component": "dashboard/index",
        "meta": {
          "title": "首页",
          "icon": "dashboard"
        }
      }]
    },
    {
      "path": "/example",
      "component": "Layout",
      "redirect": "/example/table",
      "name": "Example",
      "meta": {
        "title": "案例",
        "icon": "example"
      },
      "children": [{
          "path": "table",
          "name": "Table",
          "component": "table/index",
          "meta": {
            "title": "表格",
            "icon": "table"
          }
        },
        {
          "path": "tree",
          "name": "Tree",
          "component": "tree/index",
          "meta": {
            "title": "树形菜单",
            "icon": "tree"
          }
        }
      ]
    },
    {
      "path": "/form",
      "component": "Layout",
      "children": [{
        "path": "index",
        "name": "Form",
        "component": "form/index",
        "meta": {
          "title": "表单",
          "icon": "form"
        }
      }]
    },
    {
      "path": "*",
      "redirect": "/404",
      "hidden": true
    }
  ]

}
router.beforeEach((to, from, next) => {
  console.log(getRouter)
  if (!getRouter) { //不加这个判断，路由会陷入死循环
    if (!getObjArr('router')) {
      // easy-mock官网经常挂掉，所以就不请求了,你们可以替换成自己公司的接口去请求,把下方的axios请求打开即可
      // axios.get('https://www.easy-mock.com/mock/5a5da330d9b48c260cb42ca8/example/antrouter').then(res => {
      console.log('beforeEach  getRouter')
      getRouter = fakeRouter.router //假装模拟后台请求得到的路由数据
      saveObjArr('router', getRouter) //存储路由到localStorage

      beforeRouterGo(to, next) //执行路由跳转方法
      // })
    } else { //从localStorage拿到了路由
      getRouter = getObjArr('router') //拿到路由
      // setPath(data.router);
      // getRouter = data.router;

      console.log(getRouter)
      beforeRouterGo(to, next)
    }
  } else {
    next()
  }

})

function setPath(routers) {
  routers.forEach(function(item) {
    if (!item.path) {
      item.path = item.route && item.route.length > 0 ? item.route : "";
    }
    if (!item.component) {
      item.component = "addRouter/index"
    }
    item.meta = {
      title : item.name
    }
    if (item.sub_menu && item.sub_menu.length >0) {
      setPath(item.sub_menu);
      item.children = item.sub_menu;
    }
  })
}

function beforeRouterGo(to, next) {
  debugger
  axios.get('/get_menu')
  .then(res => {
    console.log(true, res);
    setPath(res.data.data);
    getRouter = res.data.data;
    routerGo(to, next);
  })
  .catch((err) => {
    console.log(false, err);
    setPath(data.router);
    getRouter = data.router;
    routerGo(to, next);
  });
}

function routerGo(to, next) {
  console.log(getRouter)
  let allRouter = fakeRouter.router.concat(getRouter);
  getRouter = filterAsyncRouter(allRouter) //过滤路由
  
  // getRouter = filterAsyncRouter(getRouter) //过滤路由
  router.addRoutes(getRouter) //动态添加路由
  global.antRouter = getRouter //将路由数据传递给全局变量，做侧边栏菜单渲染工作
  next({ ...to, replace: true })
}

function saveObjArr(name, data) { //localStorage 存储数组对象的方法
  localStorage.setItem(name, JSON.stringify(data))
}

function getObjArr(name) { //localStorage 获取数组对象的方法
  return JSON.parse(window.localStorage.getItem(name));

}

function filterAsyncRouter(asyncRouterMap) { //遍历后台传来的路由字符串，转换为组件对象
  const accessedRouters = asyncRouterMap.filter(route => {
    if (route.component) {
      if (route.component === 'Layout') { //Layout组件特殊处理
        route.component = Layout
      } else {
        route.component = _import(route.component)
      }
    }
    if (route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children)
    }
    return true
  })

  return accessedRouters
}
