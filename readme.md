
<br><h1 align="center"><a target="_blank" href="https://tinypage.app">Tinypage</a>, the open-source micro-site platform</h1>
<p align="center">
        <img src="https://img.shields.io/badge/Beta-1.2.0-%23478ecc" alt="Version">
    <a href="https://www.gnu.org/licenses/gpl-3.0.en.html">
        <img src="https://img.shields.io/badge/License-GPL-%236ab04c" alt="License"/>
    </a>
    <a href="https:/tinypage.app/analytics"/>
        <img src="https://img.shields.io/badge/dynamic/json?color=FF4081&label=Cloud-hosted%20users&query=users&url=https%3A%2F%2Fapi.tinypage.app%2Fanalytics" alt="Users"/>
    </a>
	<a href="https://discord.gg/CrK96b6J">
		<img src="https://img.shields.io/discord/823942269811294268?color=%237289da&label=Join%20our%20community%20on%20Discord"/>
	</a>
</p>

<img src="editor/static/gh-hero.png"/>

<div align="center">

</div>

<br><br>

## Getting started

To install <a target="_blank" href="https://tinypage.app">Tinypage</a> locally, follow our steps below or watch one
of our available <a href="https://youtube.com/" target="_blank">video installation guides! 👉</a>

### Pre-requisites

To install <a target="_blank" href="https://tinypage.app">Tinypage</a>, please ensure you have the following
installed.

- <a href="https://www.postgresql.org/" target="_blank">PostgreSQL</a>
- <a href="https://nodejs.org/en/" target="_blank">NPM/Node.JS</a>
- <a href="https://www.docker.com/" target="_blank">Docker</a> (optional)

Optionally, you can also provide API credentials for the following providers to enable additional features.

- <a href="https://mixpanel.com" target="_blank">Mixpanel</a> (Event tracking)
- <a href="https://www.simplefileupload.com/" target="_blank">SimpleFileUpload</a> (Avatar upload/file storage)

### Setup with NPM
1. Clone the repository
```bash
git clone https://github.com/achrafbou1/Tinypage
```
2. Install the dependencies with NPM
```bash
cd api;npm install;cd ../editor;npm install;cd ../renderer;npm install;cd ../
```
3. Run the setup script
```bash
npm run setup
```
4. Build & launch <a target="_blank" href="https://tinypage.app">Tinypage</a>

Build all the modules

```bash
npm run build
```

Start the API in one terminal:

```bash
cd api; npm run start;
```

Start the editor in another terminal:

```bash
cd editor; PORT=8080 API_URL=http://localhost:5566 npm run start
```

Start the renderer in another terminal:

```bash
cd renderer; PORT=8081 API_URL=http://localhost:5566 npm run start
```

### Development setup
The development setup is similar to the vanilla NPM setup, however comes with <a href="https://vue-loader.vuejs.org/guide/hot-reload.html" target="_blank">hot-reloading</a> enabled.<br>**🚨 This should not be used in production 🚨**
1. Clone the repository
```bash
git clone https://github.com/achrafbou1/Tinypage
```
2. Install the dependencies with NPM
```bash
cd api;npm install;cd ../editor;npm install;cd ../renderer;npm install;cd ../
```
3. Run the setup script
```bash
npm run setup
```
4. Launch <a target="_blank" href="https://singlelink.co">Singlelink</a> with hot-reloading enabled

Start the API in one terminal:

```bash
cd api; npm run dev;
```

Start the editor in another terminal:

```bash
cd editor; PORT=8080 API_URL=http://localhost:5566 npm run dev
```

Start the renderer in another terminal:

```bash
cd renderer; PORT=8081 API_URL=http://localhost:5566 npm run dev
```

## Screenshots
<img src="editor/static/screenshot-01.png"/>
<img src="editor/static/screenshot-02.png"/>
<img src="editor/static/screenshot-03.png"/>

## Roadmap
See our <a href="https://github.com/achrafbou1/Tinypage/issues" target="_blank">open issues</a> to see what we're building next, alongside a list of known bugs and suggestions. <br>Don't see what you're looking for? <a href="https://github.com/achrafbou1/Tinypage/issues/new" target="_blank">Submit an issue!</a>

## Support
Need help? Our <a href="https://discord.com/invite/CrK96b6J" target="_blank">community support </a> is online 9AM-5PM EST M-F, and our <a href="mailto:support@neutroncreative.com">enterprise support team</a> is available 24/7/365 via (<a href="mailto:support@neutroncreative.com">email</a> or <a href="tel:+19196530790">phone</a>). Please don't hesitate to get in touch, we love to help and we're often able to resolve issues within the hour!

## Contributing
Being open-source, we welcome and encourage all contributions to our project.

To make your first contribution, follow these steps:

1. Fork the project
2. Create your new feature's branch
3. Make your changes
4. Commit your changes & push
5. Open a pull request

## Acknowledgements
Special thanks to the <a target="_blank" href="https://singlelink.co">Singlelink</a> team for starting out the project and it's core features.
### Our partners & sponsors
- <a href="https://www.browserstack.com/" target="_blank">BrowserStack</a> (cross-broswer UI/UX testing, sponsor)
- <a href="https://digitalocean.com/" target="_blank">DigitalOcean</a> (cloud hosting for developers, partner)

### Singlelink team members
<a href="https://twitter.com/jim_bisenius" title="Jim Bisenius, Co-founder & President of Singlelink" target="_blank"><img width="80" src="https://www.gravatar.com/avatar/106e7dda3325b238cc5845df807e9c2d"/></a>
<a href="https://twitter.com/navidk0" title="Navid Kabir, Co-founder & CTO of Singlelink" target="_blank"><img width="80" src="https://www.gravatar.com/avatar/9e4f9cbfec8e363db6c16ad3f32043fb"/></a>
<a href="https://twitter.com/drewbits" title="Drew Boyle, Co-founder & CMO of Singlelink" target="_blank"><img width="80" src="https://pbs.twimg.com/profile_images/1407168359729352706/cLCu_-OF_400x400.png"/></a>

### Tinypage team members
<a href="https://github.com/MieleMadness" title="Philip Miele, Founder & Marketing specialist" target="_blank"><img width="80" src="https://www.gravatar.com/avatar/649e9e784e5b5d5ad2c530049738ba12"/></a>

<a href="https://github.com/achrafbou1" title="Achraf Boutat, Co-founder & Software Engineer" target="_blank"><img width="80" src="https://en.gravatar.com/userimage/230818844/649e9e784e5b5d5ad2c530049738ba12.jpg?size=200"/></a>

<br><br>
---------------
<h3 align="center"><a href="https://singlelink.co" target="_blank">Tinypage</a>, the open-source micro-site platform</h3>
<h4 align="center">
    Create your free micro-site in seconds at <a href="https://edit.tinypage.app/create-account" target="_blank">tinypage.app 👉</a>
</h4>
