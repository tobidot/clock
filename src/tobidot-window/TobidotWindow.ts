/// <reference types="vite/client" />
import { EventBase, EventSocket, get_element_by_class_name, get_element_by_id, Rect } from "@game.object/ts-game-toolbox";
import html from './tobidot-window.html?raw';
import css from './tobidot-window.scss?url';
import { get_parent_relative_element } from "../utils/dom";
import { AppletBaseRenderer, load_applet, observe_applet_settings_change } from "../utils/applet";
import { TobidotClockEmbedMode } from "../tobidot-clock/TobidotClock";

declare global {
    interface HTMLElementTagNameMap {
        'tobidot-window': TobidotWindow;
    }

    interface GlobalEventHandlersEventMap {
        'tbdt.window.resize': TobidotWindowResizeEvent;
    }
}

export interface TobidotWindowResizeDetail {
    mode: TobidotWindowState,
    boundaries: DOMRect,
}

export type TobidotWindowResizeEvent = CustomEvent<TobidotWindowResizeDetail>;

export type TobidotWindowEvents = EventBase;

export enum TobidotWindowEmbedMode {
    FIXED = 'fixed',
    WINDOW = 'window',
}

export enum TobidotWindowState {
    WINDOWED = 'windowed',
    MAXIMIZED = 'maximized',
    MINIMIZED = 'minimized',
}

/**
 * data-embed-mode: 'fixed' | 'window' // Is this a fix borderless element, or a movable window.
 * data-state: 'windowed' | 'maximized' | 'minimized' // The size of the window.
 */
export class TobidotWindow extends HTMLElement {

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
    public embedMode: TobidotWindowEmbedMode = TobidotWindowEmbedMode.FIXED;
    public width: number = 320;
    public height: number = 200;

    constructor(
        protected parent: TobidotWindow
    ) {
    }

    public load() {
        this.embedMode = {
            'fixed': TobidotWindowEmbedMode.FIXED,
            'window': TobidotWindowEmbedMode.WINDOW,
        }[this.parent.dataset?.embedMode ?? 'fixed'] ?? TobidotWindowEmbedMode.FIXED;
        this.width = this.parent.dataset?.width ? parseInt(this.parent.dataset.width) : 320;
        this.height = this.parent.dataset?.height ? parseInt(this.parent.dataset.height) : 200;
    }
}

class Renderer extends AppletBaseRenderer<TobidotWindow> {
    constructor(
        protected parent: TobidotWindow
    ) {
        super(parent, html, css);
    }

    public apply_settings(): void {
        this.parent.style.position = {
            [TobidotClockEmbedMode.FIXED]: 'static',
            [TobidotClockEmbedMode.WINDOW]: 'absolute',
        }[this.parent.settings.embedMode];
        this.root.dataset.embedMode = this.parent.settings.embedMode;
        this.parent.style.width = this.parent.settings.width ? `${this.parent.settings.width}px` : '';
        this.parent.style.height = this.parent.settings.height ? `${this.parent.settings.height}px` : '';
    };

}

class References {
    public $root: HTMLElement;
    public $panel: HTMLElement;
    public $screen: HTMLElement;
    public $actions: Array<HTMLButtonElement>;

    constructor(
        protected parent: TobidotWindow
    ) {
        this.$root = this.parent.renderer.root;
        this.$panel = get_element_by_class_name(this.$root, 'panel');
        this.$screen = get_element_by_class_name(this.$root, 'screen');
        this.$actions = [];
        const $actions = this.$root.getElementsByTagName('button');
        for (let i = 0; i < $actions.length; i++) {
            const $action = $actions[i];
            if ($action instanceof HTMLButtonElement) {
                this.$actions.push($action);
            }
        }
    }
}

class Logic {

    constructor(
        protected parent: TobidotWindow
    ) {
    }

    public init() {
        load_applet(this.parent, References);
        this.update_screen_boundary();
        this.restore();
    }

    public update() {
    }

    public handle_action(action: string) {
        switch (action) {
            case 'close':
                this.close();
                break;
            case 'minimize':
                // Toggle between minimized and normal state)
                switch (this.parent.props.state) {
                    case TobidotWindowState.MINIMIZED:
                        this.restore();
                        break;
                    default:
                        this.minimize();
                        break;
                }
                break;
            case 'maximize':
                // Toggle between maximized and normal state)
                switch (this.parent.props.state) {
                    case TobidotWindowState.MAXIMIZED:
                        this.restore();
                        break;
                    default:
                        this.maximize();
                        break;
                }
                break;
            default:
                console.warn(`Unknown action: ${action}`);
        }
    }

    public close() {
        this.parent.remove();
    }

    public maximize() {
        this.parent.style.position = 'static';
        this.parent.style.width = '100%';
        this.parent.style.height = '100%';
        this.parent.style.gridArea = "1 / 1 / -1 / -1";
        this.parent.refs.$root.dataset.state = TobidotWindowState.MAXIMIZED;
        this.parent.props.state = TobidotWindowState.MAXIMIZED;
        this.parent.refs.$screen.style.width = '';
        this.parent.refs.$screen.style.height = '';
        this.dispatch_event_resize();
    }

    public minimize() {
        this.parent.refs.$root.dataset.state = TobidotWindowState.MINIMIZED;
        this.parent.style.width = `auto`;
        this.parent.style.height = `auto`;
        this.parent.style.gridArea = "";
        this.parent.props.state = TobidotWindowState.MINIMIZED;
        this.parent.refs.$screen.style.width = `auto`;
        this.parent.refs.$screen.style.height = `auto`;
        this.dispatch_event_resize();
    }

    public restore() {
        this.parent.style.position = 'absolute';
        this.parent.style.display = '';
        this.parent.style.width = ''
        this.parent.style.height = '';
        this.parent.style.gridArea = "";
        this.parent.refs.$root.dataset.state = TobidotWindowState.WINDOWED;
        this.parent.props.state = TobidotWindowState.WINDOWED;
        this.parent.refs.$screen.style.width = `${this.parent.settings.width}px`;
        this.parent.refs.$screen.style.height = `${this.parent.settings.height}px`;
        this.dispatch_event_resize();
    }

    public dispatch_event_resize() {
        const boundaries = this.parent.refs.$screen.getBoundingClientRect();
        const detail: TobidotWindowResizeDetail = {
            mode: this.parent.props.state,
            boundaries,
        };
        const event = new CustomEvent<TobidotWindowResizeDetail>('tbdt.window.resize', {
            detail,
            bubbles: true,
            composed: true,
        })
        this.parent.dispatchEvent(event);
    }

    public update_screen_boundary() {
        if (!this.parent) {
            // if this window is currently not attached to the dom don't do anything
            return;
        }
        // Update the screen boundary based on the current window size
        const screen_rect = get_parent_relative_element(this.parent)?.getBoundingClientRect();
        if (!screen_rect) {
            console.warn('Screen boundary could not be determined, parent element is not available.');
            return;
        }
        this.parent.props.screen_boundary = new Rect(
            screen_rect.left,
            screen_rect.top,
            screen_rect.width - 50,
            screen_rect.height - 50,
        );
        this.dispatch_event_resize();
    }
}

class Properties {
    public pointer_handle: number | null = null;
    public pointer_grab_offset_x: number = 0;
    public pointer_grab_offset_y: number = 0;
    public screen_boundary: Rect = new Rect(0, 0, 0, 0);
    public state: TobidotWindowState = TobidotWindowState.WINDOWED;

    constructor(
        protected parent: TobidotWindow
    ) {
    }
}

class Components {
    constructor(
        protected parent: TobidotWindow
    ) {
    }
}

class Listeners {
    protected animation_frame_handle: number | null = null;

    constructor(
        protected parent: TobidotWindow
    ) {
        observe_applet_settings_change(
            ['data-mode'],
            this.parent,
            References,
        );
        this.attach();
    }

    public detach() {
        // Detach event listeners and observers, before rerendering the applet
        window.removeEventListener('resize', this.on_window_resize);
        this.parent.refs.$panel.removeEventListener('pointerdown', this.on_pointer_down);
        this.parent.refs.$panel.removeEventListener('pointermove', this.on_pointer_move);
        this.parent.refs.$panel.removeEventListener('pointerup', this.on_pointer_up);
        if (this.animation_frame_handle !== null) {
            cancelAnimationFrame(this.animation_frame_handle);
        }
    }

    public attach() {
        window.addEventListener('resize', this.on_window_resize);
        this.parent.refs.$actions.forEach(($action) => {
            $action.addEventListener('click', this.on_action_click);
        });
        this.parent.refs.$panel.addEventListener('pointerdown', this.on_pointer_down);
        if (!this.animation_frame_handle) {
            requestAnimationFrame(this.on_animation_frame);
            this.animation_frame_handle = null;
        }
    }

    protected on_action_click = (event: MouseEvent) => {
        const $action = event.currentTarget;
        if (event.button !== 0) {
            // Only handle left-clicks
            return;
        }
        if (!($action instanceof HTMLButtonElement)) {
            return;
        }

        const action = $action.name;
        this.parent.logic.handle_action(action);
        // do not click through the action
        event.stopPropagation();
    }

    protected on_animation_frame = () => {
        this.parent.logic.update();

        this.animation_frame_handle = requestAnimationFrame(this.on_animation_frame);
    }

    protected on_window_resize = () => {
        this.parent.logic.update_screen_boundary();
    }

    protected on_pointer_down = (event: PointerEvent) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            // Ensure the target is an HTMLElement
            return;
        }
        for (const $target of event.composedPath()) {
            if ($target === this.parent.refs.$panel) {
                // If the pointer down event is on the panel itself, handle it
                break;
            }
            if ($target instanceof HTMLButtonElement) {
                // If the pointer down event is on a inner button, do not handle it
                return;
            }
        }
        // Calculate and Store offset between pointer and box position
        const $main = this.parent;
        const $panel = this.parent.refs.$panel;
        this.parent.props.pointer_grab_offset_x = event.clientX - $main.offsetLeft;
        this.parent.props.pointer_grab_offset_y = event.clientY - $main.offsetTop;

        // capture pointer events from here on
        $panel.style.cursor = 'grabbing';
        $panel.setPointerCapture(this.parent.props.pointer_handle = event.pointerId);
        $panel.addEventListener('pointermove', this.on_pointer_move);
        $panel.addEventListener('pointerup', this.on_pointer_up);
    }

    protected on_pointer_up = (event: PointerEvent) => {
        if (this.parent.props.pointer_handle === null) {
            return;
        }
        const $panel = this.parent.refs.$panel;
        // Release pointer capture and reset cursor
        $panel.style.cursor = 'grab';
        $panel.releasePointerCapture(this.parent.props.pointer_handle);
        $panel.removeEventListener('pointermove', this.on_pointer_move);
        $panel.removeEventListener('pointerup', this.on_pointer_up);
    }

    protected on_pointer_move = (event: PointerEvent) => {
        if (this.parent.props.pointer_handle === null) {
            return;
        }
        // Move the window
        const screen_boundary = this.parent.props.screen_boundary;
        const target_x = event.clientX - this.parent.props.pointer_grab_offset_x;
        const target_y = event.clientY - this.parent.props.pointer_grab_offset_y;
        // Check if the new position is within the screen boundary
        const new_x = Math.max(Math.min(target_x, screen_boundary.right), screen_boundary.left);
        const new_y = Math.max(Math.min(target_y, screen_boundary.bottom), screen_boundary.top);
        const $main = this.parent;
        $main.style.left = `${new_x}px`;
        $main.style.top = `${new_y}px`;
    }


}
