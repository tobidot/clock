/// <reference types="vite/client" />
import { EventBase, EventSocket, get_element_by_class_name, get_element_by_id, Rect } from "@game.object/ts-game-toolbox";
import html from './tobidot-window.html?raw';
import css from './tobidot-window.scss?url';
import { AppletBaseRenderer, load_applet, observe_applet_settings_change } from "../../utils/applet";

export type TobidotAppletEvents = EventBase;

enum TobidotAppletMode {
    DEFAULT = 'default',
}

export class TobidotApplet extends HTMLElement {

    public events: EventSocket<TobidotAppletEvents> = new EventSocket();

    public settings: Settings;
    public renderer: Renderer;
    public refs: References;
    public logic: Logic;
    public props: Properties;
    public components: Components;
    public listeners: Listeners;

    constructor() {
        super();
        this.settings = new Settings(this);
        this.renderer = new Renderer(this);
        this.logic = new Logic(this);
        this.refs = new References(this);
        this.props = new Properties(this);
        this.components = new Components(this);
        this.listeners = new Listeners(this);
        // call init when the document is ready
        if (document.readyState === "complete") {
            this.logic.init();
        } else {
            window.addEventListener('load', () => {
                this.logic.init();
            });
        }
    }
}

class Settings {
    public mode: TobidotAppletMode = TobidotAppletMode.DEFAULT;

    constructor(
        protected parent: TobidotApplet
    ) {
    }

    public load() {
        // Load settings from the applet element attributes
        this.mode = {
            'default': TobidotAppletMode.DEFAULT,
        }[this.parent.dataset.mode ?? ''] ?? TobidotAppletMode.DEFAULT;
        // Add more settings as needed
    }
}

class Renderer extends AppletBaseRenderer<TobidotApplet> {
    constructor(
        protected parent: TobidotApplet
    ) {
        super(parent, html, css);
    }

    public apply_settings(): void {
        // apply settings from outside to the rendered html
    }
}

class References {
    public $root: HTMLElement;

    constructor(
        protected parent: TobidotApplet
    ) {
        this.$root = this.parent.renderer.root;
    }
}

class Logic {
    constructor(
        protected parent: TobidotApplet
    ) {
    }

    public init() {
        // init call after all should be loaded for the applet to use.
        load_applet(this.parent, References);
    }

    public update() {
        // called every frame to update the screen
    }
}

class Properties {
    constructor(
        protected parent: TobidotApplet
    ) {
    }
}

class Components {
    constructor(
        protected parent: TobidotApplet
    ) {
    }
}

class Listeners {
    protected animation_frame_handle: number | null = null;
    protected applet_observer: MutationObserver | null = null;

    constructor(
        protected parent: TobidotApplet
    ) {
        this.attach();
    }

    public detach() {
        // detach event listeners and observers, before rerendering the applet
    }

    public attach() {
        // Attach event listeners and observers
        // this might be called multiple times, if the applet is reloaded due to settings changes
        if (!this.animation_frame_handle) {
            this.animation_frame_handle = requestAnimationFrame(this.on_animation_frame);
        }
        if (!this.applet_observer) {
            // Listen for changes in the applet settings
            this.applet_observer = observe_applet_settings_change(
                ['data-mode',],
                this.parent,
                References
            );
        }
    }

    protected on_animation_frame = () => {
        this.parent.logic.update();

        requestAnimationFrame(this.on_animation_frame);
    }
}
