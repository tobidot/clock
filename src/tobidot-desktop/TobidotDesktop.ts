/// <reference types="vite/client" />
import { EventBase, EventSocket, get_element_by_class_name, get_element_by_id } from "@game.object/ts-game-toolbox";
import html from './tobidot-desktop.html?raw';
import css from './tobidot-desktop.scss?url';

export type TobidotDesktopEvents = EventBase;

export class TobidotDesktop extends HTMLElement {

    public events: EventSocket<TobidotDesktopEvents> = new EventSocket();

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
    }
}

class Settings {
    public override_style: string | null = null;

    constructor(
        protected parent: TobidotDesktop
    ) {
        this.override_style = parent.dataset?.override_style ?? null;
    }
}

class Renderer {
    public shadow: ShadowRoot;
    public root: HTMLElement;

    constructor(
        protected parent: TobidotDesktop
    ) {
        this.shadow = this.parent.attachShadow({ mode: 'open' });
        this.shadow.appendChild(this.render_style());
        this.shadow.appendChild(this.root = this.render_content());
    }

    public refresh(): HTMLElement {
        this.root.remove();
        this.root = this.render_content();
        this.shadow.appendChild(this.root);
        return this.root;
    }

    public render_content(): HTMLElement {
        const root = document.createElement('div');
        root.id = 'root';
        root.innerHTML = html;
        const $main = this.parent;
        $main.style.width = '100%';
        $main.style.height = '100%';
        return root;
    }

    public render_style(): HTMLElement {
        const override_style = this.parent.settings.override_style;
        if (override_style) {
            try {
                const url = new URL(override_style, window.location.href);
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = url.href;
                return link;
            } catch (_) {
                // If the override_style is not a valid URL, treat it as inline CSS
                const style = document.createElement('style');
                style.textContent = override_style;
                return style;
            }
        }
        // If no override_style is provided, use the default CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = css;
        return link;
    }
}

class References {

    constructor(
        protected parent: TobidotDesktop
    ) {
        const shadow = this.parent.shadowRoot;
        const root = shadow?.getElementById('root');
        if (!(root instanceof HTMLElement)) {
            throw new Error('Shadow root not found');
        }
    }
}

class Logic {
    constructor(
        protected parent: TobidotDesktop
    ) {
    }

    public update() {
    }
}

class Properties {

    constructor(
        protected parent: TobidotDesktop
    ) {
    }
}

class Components {
    constructor(
        protected parent: TobidotDesktop
    ) {
    }
}

class Listeners {
    constructor(
        protected parent: TobidotDesktop
    ) {
        requestAnimationFrame(this.on_animation_frame);
        const observer = new MutationObserver((mutations: Array<MutationRecord>) => {
            this.parent.settings = new Settings(this.parent);
            this.parent.renderer.refresh();
            this.parent.refs = new References(this.parent);
        });
        observer.observe(this.parent, {
            attributes: true,
            attributeFilter: ['data-override-style'],
        });
    }

    protected on_animation_frame = () => {
        this.parent.logic.update();

        requestAnimationFrame(this.on_animation_frame);
    }
}
