/// <reference types="vite/client" />
import { EventBase, EventSocket, get_element_by_class_name, get_element_by_id, Rect, Vector2, Vector2I } from "@game.object/ts-game-toolbox";
import html from './tobidot-icon.html?raw';
import css from './tobidot-icon.scss?url';
import { AppletBaseRenderer, load_applet, observe_applet_settings_change } from "../utils/applet";
import { get_parent_relative_element } from "../utils/dom";
import { TobidotIconExecuteEvent } from "./TobidotIconExecuteEvent";

export type TobidotIconEvents = TobidotIconExecuteEvent;

export enum TobidotIconPositionMode {
    FREE = 'free',
    RASTERIZED = 'rasterized',
}

/**
 * data-position-mode: 
 *  'free' - the icon can be moved freely 
 *  'rasterized' - the icon is rasterized and can only be moved in a grid-like manner
 */
export class TobidotIcon extends HTMLElement {

    public events: EventSocket<TobidotIconEvents> = new EventSocket();

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
    public position_mode: TobidotIconPositionMode = TobidotIconPositionMode.RASTERIZED;
    public cell_width: number = 128;
    public cell_height: number = 128;

    constructor(
        protected parent: TobidotIcon
    ) {
    }

    public load() {
        this.position_mode = {
            'rasterized': TobidotIconPositionMode.RASTERIZED,
            'free': TobidotIconPositionMode.FREE,
        }[this.parent.dataset?.positionMode ?? 'rasterized'] ?? TobidotIconPositionMode.RASTERIZED;
        this.cell_width = parseInt(this.parent.dataset?.cellWidth ?? '128', 10);
        this.cell_height = parseInt(this.parent.dataset?.cellHeight ?? '128', 10);
    }
}

class Renderer extends AppletBaseRenderer<TobidotIcon> {
    constructor(
        protected parent: TobidotIcon
    ) {
        super(parent, html, css);
    }

    public apply_settings(): void {
        this.parent.style.position = {
            [TobidotIconPositionMode.RASTERIZED]: 'static',
            [TobidotIconPositionMode.FREE]: 'absolute',
        }[this.parent.settings.position_mode];
    };

}

class References {
    public $host: HTMLElement;
    public $root: HTMLElement;
    public $slot: HTMLSlotElement | null = null;

    constructor(
        protected parent: TobidotIcon
    ) {
        this.$host = this.parent;
        this.$root = this.parent.renderer.root;
        const slot = this.$root.querySelector('slot[name="template"]');
        if (slot instanceof HTMLSlotElement) {
            this.$slot = slot;
        }
    }
}

class Logic {
    constructor(
        protected parent: TobidotIcon
    ) {
    }

    public init() {
        load_applet(this.parent, References);
        this.update_screen_boundary();
        this.update_grid();
    }

    public update() {
    }

    public execute() {
        console.log('Executing TobidotIcon action');
        const event = new TobidotIconExecuteEvent();
        const $slot = this.parent.refs.$slot;
        if ($slot) {
            const $template = $slot.assignedElements()[0];
            if ($template instanceof HTMLTemplateElement) {
                const $fragment = $template.content.cloneNode(true) as DocumentFragment;
                const $clone = $fragment.firstElementChild;
                const $desktop = this.parent.refs.$host.parentElement;
                if ($clone instanceof HTMLElement && $desktop instanceof HTMLElement) {
                    $clone.style.position = 'absolute';
                    $clone.style.left = `${this.parent.props.position.x}px`;
                    $clone.style.top = `${this.parent.props.position.y}px`;
                    $desktop.appendChild($clone);
                }
            }
        }
        this.parent.events.dispatch(event);
    }

    public update_screen_boundary() {
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
    }

    /**
     * Calculate the actual size of a single icon cell in the grid.
     * @returns Vector2 - The size of a single grid cell.
     */
    public update_grid() {
        const cols = Math.floor(this.parent.props.screen_boundary.width / this.parent.settings.cell_width);
        const rows = Math.floor(this.parent.props.screen_boundary.height / this.parent.settings.cell_height);
        this.parent.props.grid_cell_size = new Vector2(
            this.parent.props.screen_boundary.width / cols,
            this.parent.props.screen_boundary.height / rows,
        );
        this.parent.props.grid_size = new Vector2(cols, rows);
    }

    public convert_pixel_to_grid_position(
        pixel_position: Vector2I
    ): Vector2 {
        const grid_cell_size = this.parent.props.grid_cell_size;
        const grid_size = this.parent.props.grid_size;
        return new Vector2(
            Math.max(1, Math.min(grid_size.x, Math.ceil(pixel_position.x / grid_cell_size.x))),
            Math.max(1, Math.min(grid_size.y, Math.ceil(pixel_position.y / grid_cell_size.y))),
        );
    }

    public convert_grid_to_pixel_position(
        grid_position: Vector2I
    ): Vector2 {
        const grid_cell_size = this.parent.props.grid_cell_size;
        const screen_boundary = this.parent.props.screen_boundary;
        return new Vector2(
            Math.max(screen_boundary.left, Math.min(screen_boundary.right, Math.floor((grid_position.x - 1) * grid_cell_size.x))),
            Math.max(screen_boundary.top, Math.min(screen_boundary.bottom, Math.floor((grid_position.y - 1) * grid_cell_size.y))),
        );
    }
}

class Properties {
    // drag and drop properties
    public position: Vector2 = new Vector2(0, 0);
    public pointer_handle: number | null = null;
    public pointer_down_at: number | null = null;
    public pointer_grab_offset: Vector2 = new Vector2(0, 0);
    // 
    public screen_boundary: Rect = new Rect(0, 0, 0, 0);
    public grid_cell_size: Vector2 = new Vector2(64, 64);
    public grid_size: Vector2 = new Vector2(16, 16);
    // public state: TobidotWindowState = TobidotWindowState.WINDOWED;

    constructor(
        protected parent: TobidotIcon
    ) {
    }
}

class Components {
    constructor(
        protected parent: TobidotIcon
    ) {
    }
}

class Listeners {
    protected animation_frame_handle: number | null = null;

    constructor(
        protected parent: TobidotIcon
    ) {
        observe_applet_settings_change(
            ['data-position-mode'],
            this.parent,
            References,
        );
        this.attach();
    }

    public detach() {
        // Detach event listeners and observers, before rerendering the applet
        this.parent.refs.$host.removeEventListener('pointerdown', this.on_pointer_down);
        this.parent.refs.$host.removeEventListener('pointermove', this.on_pointer_move);
        this.parent.refs.$host.removeEventListener('pointerup', this.on_pointer_up);
        this.parent.refs.$host.removeEventListener('dblclick', this.on_dbl_click);
        if (this.animation_frame_handle !== null) {
            cancelAnimationFrame(this.animation_frame_handle);
        }
    }

    public attach() {
        this.parent.refs.$host.addEventListener('pointerdown', this.on_pointer_down);
        this.parent.refs.$host.addEventListener('dblclick', this.on_dbl_click);
        if (!this.animation_frame_handle) {
            requestAnimationFrame(this.on_animation_frame);
            this.animation_frame_handle = null;
        }
    }

    protected on_dbl_click = (event: MouseEvent) => {
        this.parent.logic.execute();
    }

    protected on_animation_frame = () => {
        this.parent.logic.update();

        this.animation_frame_handle = requestAnimationFrame(this.on_animation_frame);
    }


    protected on_pointer_down = (event: PointerEvent) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            // Ensure the target is an HTMLElement
            return;
        }
        this.parent.props.pointer_down_at = event.timeStamp;

        // Calculate and Store offset between pointer and box position
        const $host = this.parent.refs.$host;
        this.parent.props.position = new Vector2($host.offsetLeft, $host.offsetTop);

        $host.style.gridArea = '';
        $host.style.position = 'absolute';
        $host.style.left = `${this.parent.props.position.x}px`;
        $host.style.top = `${this.parent.props.position.y}px`;

        this.parent.props.pointer_grab_offset.set(event.clientX - $host.offsetLeft, event.clientY - $host.offsetTop);

        // capture pointer events from here on
        $host.setPointerCapture(this.parent.props.pointer_handle = event.pointerId);
        $host.addEventListener('pointermove', this.on_pointer_move);
        $host.addEventListener('pointerup', this.on_pointer_up);
    }

    protected on_pointer_up = (event: PointerEvent) => {
        if (this.parent.props.pointer_handle === null) {
            return;
        }
        const $host = this.parent.refs.$host;
        const position = new Vector2(event.clientX, event.clientY);
        const grid_position = this.parent.logic.convert_pixel_to_grid_position(position);
        this.parent.props.position = this.parent.logic.convert_grid_to_pixel_position(grid_position);
        // Release pointer capture and reset cursor
        $host.style.cursor = 'grab';
        $host.style.position = '';
        $host.style.transform = '';
        switch (this.parent.settings.position_mode) {
            case TobidotIconPositionMode.FREE:
                $host.style.position = 'absolute';
                $host.style.gridArea = '';
                $host.style.left = `${this.parent.props.position.x}px`;
                $host.style.top = `${this.parent.props.position.y}px`;
                break;
            case TobidotIconPositionMode.RASTERIZED:
                $host.style.position = 'static';
                $host.style.gridArea = `${grid_position.y} / ${grid_position.x} / span 1 / span 1`;
                $host.style.left = '';
                $host.style.top = '';
                break;
        }
        $host.releasePointerCapture(this.parent.props.pointer_handle);
        $host.removeEventListener('pointermove', this.on_pointer_move);
        $host.removeEventListener('pointerup', this.on_pointer_up);
    }

    protected on_pointer_move = (event: PointerEvent) => {
        if (this.parent.props.pointer_handle === null) {
            return;

        }

        const pointer_down_delta_time = event.timeStamp - (this.parent.props.pointer_down_at ?? 0);
        if (pointer_down_delta_time < 100) {
            // Ignore pointer move events that happen too soon after pointer down
            return;
        }

        // console.log(' ' + event.clientX + ' ' + event.clientY);

        // Move the window
        const screen_boundary = this.parent.props.screen_boundary;
        const client_position = new Vector2(event.clientX, event.clientY);
        const target_position = client_position.cpy().sub(this.parent.props.pointer_grab_offset);
        // Check if the new position is within the screen boundary
        this.parent.props.position.x = Math.max(Math.min(target_position.x, screen_boundary.right), screen_boundary.left);
        this.parent.props.position.y = Math.max(Math.min(target_position.y, screen_boundary.bottom), screen_boundary.top);
        //
        const $host = this.parent.refs.$host;
        $host.style.cursor = 'grabbing';
        $host.style.position = 'absolute';
        $host.style.left = `${this.parent.props.position.x}px`;
        $host.style.top = `${this.parent.props.position.y}px`;
    }
}
