/// <reference types="vite/client" />
import { EventBase, EventSocket, get_element_by_class_name, get_element_by_id } from "@game.object/ts-game-toolbox";
import html from './tobidot-clock.html?raw';
import css from './tobidot-clock.scss?url';

export type TobidotClockEvents = EventBase;

export enum TobidotClockUpdateMode {
    SMOOTH = 'smooth',
    SNAP = 'snap',
}

export enum TobidotClockEmbedMode {
    FIXED = 'fixed',
    WINDOW = 'window',
}

export class TobidotClock extends HTMLElement {

    public events: EventSocket<TobidotClockEvents> = new EventSocket();

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
    public mode: TobidotClockUpdateMode = TobidotClockUpdateMode.SMOOTH;

    constructor(
        protected parent: TobidotClock
    ) {
        this.override_style = parent.dataset?.override_style ?? null;
        this.mode = {
            'smooth': TobidotClockUpdateMode.SMOOTH,
            'snap': TobidotClockUpdateMode.SNAP,
        }[parent.dataset?.mode ?? 'smooth'] ?? TobidotClockUpdateMode.SMOOTH;
    }
}

class Renderer {
    public shadow: ShadowRoot;
    public root: HTMLElement;

    constructor(
        protected parent: TobidotClock
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
        this.parent.style.width = '100%';
        this.parent.style.height = '100%';
        root.dataset.mode = this.parent.settings.mode;
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
    public hour_hand: HTMLElement;
    public minute_hand: HTMLElement;
    public second_hand: HTMLElement;

    constructor(
        protected parent: TobidotClock
    ) {
        const shadow = this.parent.shadowRoot;
        const root = shadow?.getElementById('root');
        if (!(root instanceof HTMLElement)) {
            throw new Error('Shadow root not found');
        }
        this.hour_hand = get_element_by_class_name(root, 'hour-hand', HTMLElement);
        this.minute_hand = get_element_by_class_name(root, 'minute-hand', HTMLElement);
        this.second_hand = get_element_by_class_name(root, 'second-hand', HTMLElement);
    }
}

class Logic {
    constructor(
        protected parent: TobidotClock
    ) {
    }

    public update() {
        const hour_hand = this.parent.refs.hour_hand;
        const minute_hand = this.parent.refs.minute_hand;
        const second_hand = this.parent.refs.second_hand;
        const hour_angle = this.get_hour_angle();
        const minute_angle = this.get_minute_angle();
        const second_angle = this.get_second_angle();

        if (hour_angle === this.parent.props.current_hour_angle
            && minute_angle === this.parent.props.current_minute_angle
            && second_angle === this.parent.props.current_second_angle
        ) {
            // No change in angles, no need to update
            return;
        }
        this.parent.props.current_hour_angle = hour_angle;
        this.parent.props.current_minute_angle = minute_angle;
        this.parent.props.current_second_angle = second_angle;
        const offset = "translate(50%, 0%)";
        hour_hand.style.transform = `${offset} rotate(${hour_angle}deg)`;
        minute_hand.style.transform = `${offset} rotate(${minute_angle}deg)`;
        second_hand.style.transform = `${offset} rotate(${second_angle}deg)`;
    }

    public get_hour_angle(): number {
        const date = new Date();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        if (this.parent.settings.mode === TobidotClockUpdateMode.SNAP) {
            return (hours % 12) * 30 + minutes * 0.5;
        }
        return (hours % 12) * 30 + minutes * 0.5;
    }

    public get_minute_angle(): number {
        const date = new Date();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        if (this.parent.settings.mode === TobidotClockUpdateMode.SNAP) {
            return minutes * 6;
        }
        return minutes * 6 + seconds * 0.1;
    }

    public get_second_angle(): number {
        const date = new Date();
        const seconds = date.getSeconds();
        const milliseconds = date.getMilliseconds();
        if (this.parent.settings.mode === TobidotClockUpdateMode.SNAP) {
            return seconds * 6;
        }
        return seconds * 6 + milliseconds * 0.006;
    }
}

class Properties {
    public current_second_angle: number = 0;
    public current_minute_angle: number = 0;
    public current_hour_angle: number = 0;

    constructor(
        protected parent: TobidotClock
    ) {
    }
}

class Components {
    constructor(
        protected parent: TobidotClock
    ) {
    }
}

class Listeners {
    constructor(
        protected parent: TobidotClock
    ) {
        requestAnimationFrame(this.on_animation_frame);
        const observer = new MutationObserver((mutations: Array<MutationRecord>) => {
            this.parent.settings = new Settings(this.parent);
            this.parent.renderer.refresh();
            this.parent.refs = new References(this.parent);
        });
        observer.observe(this.parent, {
            attributes: true,
            attributeFilter: ['data-override-style', 'data-mode'],
        });
    }

    protected on_animation_frame = () => {
        this.parent.logic.update();

        requestAnimationFrame(this.on_animation_frame);
    }
}
