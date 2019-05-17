/***
 * 此代码为耦合度较高的代码，重构后代码为app-server.js
 * **/

// 导入koa，和koa 1.x不同，在koa2中，我们导入的是一个class，因此用大写的Koa表示:
const Koa = require('koa');
const nunjucks = require('nunjucks');

// 创建一个Koa对象表示web app本身:
const app = new Koa();

// 使用koa-router处理url 注意require('koa-router')返回的是函数:
const router = require('koa-router')();

// 使用koa-bodyparser解析request请求的body，并绑定到ctx.request.body:
const bodyParser = require('koa-bodyparser');


/**
 * 每收到一个http请求，koa就会调用通过app.use()注册的async函数，并传入ctx和next参数。
 * 把每个async函数称为middleware，这些middleware可以组合起来，完成很多有用的功能
 * 例如，可以用以下3个middleware组成处理链，依次打印日志，记录处理时间，输出HTML：
 * **/

// 解析
app.use(bodyParser());

function createEnv(path, opts) {
    let
        autoescape = opts.autoescape === undefined ? true : opts.autoescape,
        noCache = opts.noCache || false,
        watch = opts.watch || false,
        throwOnUndefined = opts.throwOnUndefined || false,
        env = new nunjucks.Environment(
            new nunjucks.FileSystemLoader('views', {
                noCache: noCache,
                watch: watch,
            }), {
                autoescape: autoescape,
                throwOnUndefined: throwOnUndefined
            });
    if (opts.filters) {
        for (let f in opts.filters) {
            env.addFilter(f, opts.filters[f]);
        }
    }
    return env;
}

/**
 * 变量env就表示Nunjucks模板引擎对象
 * 它有一个render(view, model)方法，正好传入view和model两个参数，并返回字符串
 * **/
let env = createEnv('views', {
    watch: true,
    filters: {
        hex: function (n) {
            return '0x' + n.toString(16);
        }
    }
});

let s = env.render('extend.html', {
    header: 'Hello',
    body: 'bla bla bla...'
});
console.log(s);


// log request URL:
app.use(async (ctx, next) => {
    console.log('request URL: ' + `${ctx.request.method} ${ctx.request.url}...`);
    await next();
});

// add url-route:
/**
 * 我们使用router.get('/path', async fn)来注册一个GET请求
 * **/
router.get('/hello/:name', async (ctx, next) => {
    let name = ctx.params.name;
    ctx.render('hello.html', { name: 'Michael' });
    ctx.response.body = `<h1>Hello, ${name}!</h1>`;
});

router.get('/', async (ctx, next) => {
    ctx.response.body = `<h1>Index</h1>
        <form action="/signin" method="post">
            <p>Name: <input name="name" value="koa"></p>
            <p>Password: <input name="password" type="password"></p>
            <p><input type="submit" value="Submit"></p>
        </form>`;
});

/**
 * 我们使用router.post('/path', async fn)来注册一个GET请求
 * **/

router.post('/signin', async (ctx, next) => {
    let name = ctx.request.body.name || '',
        password = ctx.request.body.password || '';
    console.log(`signin with name: ${name}, password: ${password}`);
    if (name === 'koa' && password === '12345') {
        ctx.response.body = `<h1>Welcome, ${name}!</h1>`;
    } else {
        ctx.response.body = `<h1>Login failed!</h1>
        <p><a href="/">Try again</a></p>`;
    }
});

// add router middleware:
app.use(router.routes());

// logger
app.use(async (ctx, next) => {
    await next();
    const rt = ctx.response.get('X-Response-Time');
    console.log(`${ctx.method} ${ctx.url} - ${rt}`);
});

// x-response-time
app.use(async (ctx, next) => {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
});

// response
app.use(async ctx => {
    ctx.body = 'Hello K2OA World';
});

app.listen(3000);
console.log('app started at port 3000...');