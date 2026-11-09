// Application de bureau iziFacture (Windows, macOS, Linux).
// Fenêtre native qui affiche l'app en ligne : les données restent dans Supabase,
// synchronisées avec le web et le téléphone, et l'app est toujours à jour sans réinstallation.

const { app, BrowserWindow, Menu, shell, session } = require('electron')
const path = require('node:path')

const APP_URL = new URL(process.env.IZI_APP_URL || 'https://izifacture-weld-rho.vercel.app')
const START_PATH = '/dashboard' // redirige vers la connexion si besoin
// Projet Supabase de l'app (authentification) : seul ce domaine Supabase s'ouvre dans la fenêtre
const SUPABASE_HOST = process.env.IZI_SUPABASE_HOST || 'utpckpgfuhkqyyvcrddo.supabase.co'

// Domaines autorisés à s'ouvrir DANS la fenêtre : l'app, l'authentification Supabase et Google.
// Tout le reste (WhatsApp, mailto, sites externes) part dans le navigateur ou l'app du système.
function isInternal(url) {
  try {
    const { protocol, host } = new URL(url)
    if (protocol === 'file:') return true
    if (protocol !== 'https:' && !(protocol === 'http:' && APP_URL.protocol === 'http:')) return false
    return host === APP_URL.host || host === SUPABASE_HOST || host === 'accounts.google.com'
  } catch {
    return false
  }
}

function openExternal(url) {
  try {
    const { protocol } = new URL(url)
    if (['https:', 'http:', 'mailto:', 'tel:'].includes(protocol)) shell.openExternal(url)
  } catch {
    // URL invalide : ignorée
  }
}

// Google refuse la connexion depuis un navigateur « intégré » : on retire les mentions Electron
// et du nom de l'app de l'agent utilisateur, qui devient celui d'un Chrome standard.
app.userAgentFallback = app.userAgentFallback.replace(/ (Electron|izifacture|iziFacture)\/\S+/gi, '')

let mainWindow = null

function showOffline(win, target) {
  win.loadFile(path.join(__dirname, 'offline.html'), { query: { target } })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 360,
    minHeight: 560,
    title: 'iziFacture',
    backgroundColor: '#fafbfc',
    show: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    webPreferences: {
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  })

  mainWindow.once('ready-to-show', () => mainWindow.show())

  const wc = mainWindow.webContents

  // Liens qui ouvrent un nouvel onglet (WhatsApp, PDF public…) : navigateur du système
  wc.setWindowOpenHandler(({ url }) => {
    if (isInternal(url)) wc.loadURL(url)
    else openExternal(url)
    return { action: 'deny' }
  })

  // Navigation (ou redirection serveur) vers un domaine externe : navigateur du système
  const keepInside = (event, url) => {
    if (!isInternal(url)) {
      event.preventDefault()
      openExternal(url)
    }
  }
  wc.on('will-navigate', keepInside)
  wc.on('will-redirect', keepInside)

  // Pas de connexion (ou site injoignable) : page hors ligne avec bouton « Réessayer »
  wc.on('did-fail-load', (_event, errorCode, _desc, url, isMainFrame) => {
    if (!isMainFrame || errorCode === -3 /* navigation annulée */) return
    if (url.startsWith('file:')) return
    showOffline(mainWindow, url || new URL(START_PATH, APP_URL).href)
  })

  wc.on('will-attach-webview', (event) => event.preventDefault())

  mainWindow.loadURL(new URL(START_PATH, APP_URL).href)
  mainWindow.on('closed', () => (mainWindow = null))
}

function buildMenu() {
  const isMac = process.platform === 'darwin'
  const template = [
    ...(isMac
      ? [
          {
            label: 'iziFacture',
            submenu: [
              { role: 'about', label: 'À propos d’iziFacture' },
              { type: 'separator' },
              { role: 'hide', label: 'Masquer iziFacture' },
              { role: 'hideOthers', label: 'Masquer les autres' },
              { role: 'unhide', label: 'Tout afficher' },
              { type: 'separator' },
              { role: 'quit', label: 'Quitter iziFacture' },
            ],
          },
        ]
      : []),
    {
      label: 'Fichier',
      submenu: [
        { label: 'Tableau de bord', accelerator: 'CmdOrCtrl+Shift+H', click: () => mainWindow?.loadURL(new URL(START_PATH, APP_URL).href) },
        { label: 'Nouvelle facture', accelerator: 'CmdOrCtrl+N', click: () => mainWindow?.loadURL(new URL('/invoices/new', APP_URL).href) },
        { type: 'separator' },
        { label: 'Ouvrir dans le navigateur', click: () => openExternal(mainWindow?.webContents.getURL() || APP_URL.href) },
        { type: 'separator' },
        isMac ? { role: 'close', label: 'Fermer la fenêtre' } : { role: 'quit', label: 'Quitter' },
      ],
    },
    {
      label: 'Édition',
      submenu: [
        { role: 'undo', label: 'Annuler' },
        { role: 'redo', label: 'Rétablir' },
        { type: 'separator' },
        { role: 'cut', label: 'Couper' },
        { role: 'copy', label: 'Copier' },
        { role: 'paste', label: 'Coller' },
        { role: 'selectAll', label: 'Tout sélectionner' },
      ],
    },
    {
      label: 'Affichage',
      submenu: [
        { role: 'reload', label: 'Actualiser' },
        { type: 'separator' },
        { role: 'resetZoom', label: 'Taille réelle' },
        { role: 'zoomIn', label: 'Agrandir' },
        { role: 'zoomOut', label: 'Réduire' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'Plein écran' },
      ],
    },
    {
      label: 'Navigation',
      submenu: [
        { label: 'Précédent', accelerator: isMac ? 'Cmd+[' : 'Alt+Left', click: () => mainWindow?.webContents.navigationHistory.goBack() },
        { label: 'Suivant', accelerator: isMac ? 'Cmd+]' : 'Alt+Right', click: () => mainWindow?.webContents.navigationHistory.goForward() },
      ],
    },
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

// Une seule instance : relancer l'app ramène la fenêtre existante au premier plan
if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (!mainWindow) return
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  })

  app.whenReady().then(() => {
    // Aucune permission sensible (caméra, micro, position…) : l'app n'en a pas besoin
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
      callback(['clipboard-sanitized-write', 'fullscreen'].includes(permission))
    })
    app.setAboutPanelOptions({ applicationName: 'iziFacture', applicationVersion: app.getVersion(), website: APP_URL.href })
    buildMenu()
    createWindow()

    // macOS : cliquer sur l'icône du Dock rouvre une fenêtre
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })
}
