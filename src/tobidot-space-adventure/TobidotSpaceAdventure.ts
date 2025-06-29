/// <reference types="vite/client" />
import { assert_never, EventBase, EventSocket, get_element_by_class_name, get_element_by_id, get_element_by_query_selector, sleep } from "@game.object/ts-game-toolbox";
import html from './index.html?raw';
import css from './index.scss?url';
import { AppletBaseRenderer, load_applet, observe_applet_settings_change } from "../utils/applet";
import { TobidotApplet } from "../templates/applet/TobidotApplet";
import { TobidotWindow, TobidotWindowResizeDetail, TobidotWindowResizeEvent } from "../tobidot-window/TobidotWindow";
import { TobidotIconPositionMode } from "../tobidot-icon/TobidotIcon";

export type TobidotSpaceAdventureEvents = EventBase;

enum TobidotSpaceAdventureSceneName {
    MAIN = 'main',
    PROLOG_MOVIE = 'prolog-movie',
    CABIN = "cabin",
    CABIN_TERMINAL = "cabin|terminal",
    CABIN_DOOR = "cabin|door",
    FLOOR = "floor",
    DEMO = "demo",
}

enum TobidotSpaceAdventureObjectName {
    START = 'start',
    BACK_TO_MAIN = "back-to-main",
    TABLET_HOME = 'tablet|home',
    TABLET_CLOSE = 'tablet|close',
    CABIN_BED = "cabin|bed",
    CABIN_TERMINAL = "cabin|terminal",
    CABIN_DOOR = "cabin|door",
    CABIN_JACKET = "cabin|jacket",
    CABIN_AIR_CONDITIONER = "cabin|air-conditioner",
    CABIN_BOTTLE_1 = "cabin|bottle-1",
    CABIN_BOTTLE_2 = "cabin|bottle-2",
    CABIN_BOTTLE_GROUP = "cabin|bottle-group",
}

enum TobidotSpaceAdventureMessageName {
    USER_MANUAL = 'user-manual',
    MAIL_SYSTEM_EMERGENCY = 'mail-system-emergency',
    MAIL_VIVIAN_BREAKUP = 'mail-vivian-breakup',
}

enum TobidotSpaceAdventureProgressFlag {
    MESSAGE_MAIL_SYSTEM_EMERGENCY,
    CABIN_ACT_TERMINAL_LOOKING_FOR_PASSWORD,
    CABIN_ACT_TERMINAL_FOUND_PASSWORD,
    CABIN_ACT_DOOR_OPEN,
}

enum TobidotSpaceAdventureMovieName {
    PROLOG = 'prolog',
}

enum TobidotSpaceAdventureTabletState {
    HOME = "home",
    MESSAGE = "message",
    CLOSED = "closed",
    HIDDEN = "hidden",
}

export class TobidotSpaceAdventure extends HTMLElement {

    public events: EventSocket<TobidotSpaceAdventureEvents> = new EventSocket();

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
    constructor(
        protected parent: TobidotSpaceAdventure
    ) {
    }

    public load() {
    }
}

class Renderer extends AppletBaseRenderer<TobidotSpaceAdventure> {

    public constructor(
        protected parent: TobidotSpaceAdventure
    ) {
        super(parent, html, css);
    }

    public apply_settings(): void {

    };

}

class References {
    public $host: HTMLElement;
    public $root: HTMLElement;
    public $audio: HTMLAudioElement;
    public $view: HTMLElement;
    public $scenes: Record<TobidotSpaceAdventureSceneName, HTMLElement>;
    public $messages: Record<TobidotSpaceAdventureMessageName, HTMLElement>;
    public $buttons: NodeListOf<HTMLButtonElement>;
    public $clickboxes: NodeListOf<SVGElement>;
    public $movies: Record<TobidotSpaceAdventureMovieName, HTMLElement>;
    public $text: HTMLElement;
    public $tablet: HTMLElement;
    public $tablet_screen: HTMLElement;
    public $tablet_message_list: HTMLElement;

    constructor(
        protected parent: TobidotSpaceAdventure
    ) {
        this.$host = this.parent;
        this.$root = this.parent.renderer.root;
        this.$audio = get_element_by_query_selector(this.$root, 'audio', HTMLAudioElement);
        this.$view = get_element_by_class_name(this.$root, "view");
        this.$scenes = {} as any;
        const $scenes = get_element_by_class_name(this.$root, 'scenes', HTMLElement);
        for (let i = 0; i < $scenes.children.length; ++i) {
            const $scene = $scenes.children.item(i);
            if ($scene instanceof HTMLElement) {
                const name = $scene.dataset.name;
                if (name && this.parent.logic.is_scene_name(name)) {
                    this.$scenes[name] = $scene;
                }
            }
        };
        const $messages = get_element_by_class_name(this.$root, 'messages', HTMLElement);
        this.$messages = {} as any;
        for (let i = 0; i < $messages.children.length; ++i) {
            const $message = $messages.children.item(i);
            if ($message instanceof HTMLElement) {
                const name = $message.dataset.name;
                if (name && this.parent.logic.is_message_name(name)) {
                    this.$messages[name] = $message;
                }
            }
        };
        const $movies = this.$root.querySelectorAll('.frames');
        this.$movies = {} as any;
        for (let i = 0; i < $movies.length; ++i) {
            const $movie = $movies.item(i);
            if ($movie instanceof HTMLElement) {
                const name = $movie.dataset.name;
                if (name && this.parent.logic.is_movie_name(name)) {
                    this.$movies[name] = $movie;
                }
            }
        };
        this.$buttons = this.$root.querySelectorAll('button');
        this.$clickboxes = this.$root.querySelectorAll('svg.clickbox');
        this.$text = get_element_by_query_selector(this.$root, '.textbox > .text', HTMLElement);
        this.$tablet = get_element_by_class_name(this.$root, 'tablet', HTMLElement);
        this.$tablet_screen = get_element_by_class_name(this.$root, 'tablet__screen', HTMLElement);
        this.$tablet_message_list = get_element_by_class_name(this.$root, 'tablet__messages-list', HTMLElement);
    }
}

class Logic {
    constructor(
        protected parent: TobidotSpaceAdventure
    ) {
    }

    public init() {
        load_applet(this.parent, References);
        this.parent.refs.$audio.volume = 0.2;
        this.load_scene(TobidotSpaceAdventureSceneName.MAIN);
        // this.load_scene(TobidotSpaceAdventureSceneName.CABIN);
        // this.load_scene(TobidotSpaceAdventureSceneName.DEMO);
        this.add_message(TobidotSpaceAdventureMessageName.USER_MANUAL);
    }


    public update() {
    }

    public is_scene_object(value: string): value is TobidotSpaceAdventureObjectName {
        return Object.values(TobidotSpaceAdventureObjectName).includes(value as any);
    }

    public is_message_name(value: string): value is TobidotSpaceAdventureMessageName {
        return Object.values(TobidotSpaceAdventureMessageName).includes(value as any);
    }

    public is_scene_name(value: string): value is TobidotSpaceAdventureSceneName {
        return Object.values(TobidotSpaceAdventureSceneName).includes(value as any);
    }

    public is_movie_name(value: string): value is TobidotSpaceAdventureMovieName {
        return Object.values(TobidotSpaceAdventureMovieName).includes(value as any);
    }

    public async text(
        message: string,
        timeout: number = 5000,
    ): Promise<void> {
        const $text = this.parent.refs.$text;
        $text.innerText = message;
        return new Promise<void>((resolve, reject) => {
            this.parent.props.trigger_skip_movie_frame = resolve;
            setTimeout(resolve, timeout);
        }).then(() => {
            $text.innerText = '';
        }).finally(() => {
            this.parent.props.trigger_skip_movie_frame = null;
        });
    }

    public async text_multi(
        messages: Array<[string, number] | string>,
    ): Promise<void> {
        for (let item of messages) {
            if (item instanceof Array) {
                await this.text(item[0], item[1]);
            } else {
                await this.text(item);
            }
        }
    }

    public load_scene(
        scene: TobidotSpaceAdventureSceneName
    ) {
        const $old_scene = this.parent.props.$current_scene;
        const $new_scene = this.parent.refs.$scenes[scene];
        if ($old_scene) {
            $old_scene.after($new_scene);
            $old_scene?.remove();
        } else {
            this.parent.refs.$view.prepend($new_scene);
        }
        this.parent.props.$current_scene = $new_scene;
        this.refresh_view_scale();
        this.action_enter(scene);
    }

    public refresh_view_scale() {
        const view_box = this.parent.refs.$view.getBoundingClientRect();
        const scale_x = view_box.width / 400;
        const scale_y = view_box.height / 300;
        // const min_scale = Math.min(scale_x, scale_y);
        const $current_scene = this.parent.props.$current_scene;
        if ($current_scene) {
            $current_scene.style.transform = `scale(${scale_x}, ${scale_y})`;
        }
    }

    public action_enter(
        scene: TobidotSpaceAdventureSceneName
    ) {
        const $scene = this.parent.refs.$scenes[scene];
        switch (scene) {
            case TobidotSpaceAdventureSceneName.PROLOG_MOVIE: {
                this.play_movie(TobidotSpaceAdventureMovieName.PROLOG)
                    .then(() => {
                        this.load_scene(TobidotSpaceAdventureSceneName.CABIN);
                    })
                    .catch(console.error);
            }
                break;
        }
    }

    public async play_movie(
        movie: TobidotSpaceAdventureMovieName
    ) {
        const $movie = this.parent.refs.$movies[movie];
        const $frames = $movie.querySelectorAll('.frame') as NodeListOf<HTMLElement>;
        const frame_state: {
            $root: HTMLElement,
            $audios: NodeListOf<HTMLAudioElement>
        } = {} as any;
        const start_frame = (i: number) => {
            frame_state.$root = $frames.item(i);
            frame_state.$audios = frame_state.$root.querySelectorAll('audio');
            frame_state.$audios.forEach(($audio) => {
                $audio.volume = Math.min(100, this.parent.refs.$audio.volume * 1.5);
                $audio.play();
            });
            frame_state.$root.classList.add('show');
        };
        const wait_frame = async () => {
            const delay = Number.parseFloat(frame_state.$root.dataset.delay ?? '1') * 1000.0;
            return new Promise<void>((resolve, reject) => {
                this.parent.props.trigger_skip_movie_frame = resolve;
                setTimeout(resolve, delay);
            }).finally(() => {
                this.parent.props.trigger_skip_movie_frame = null;
            });
        }
        const end_frame = () => {
            // frame_state.$root.classList.remove('show');
            frame_state.$audios.forEach(($audio) => {
                $audio.pause();
            });
        };
        start_frame(0);
        let i = 1;
        while (i < $frames.length) {
            await wait_frame();
            end_frame();
            start_frame(i);
            i++;
        }
    }

    public action_use(name: string) {
        console.log('Use', name);
        if (!this.is_scene_object(name)) {
            console.error("Unkown object", name);
            return;
        }
        switch (name) {
            case TobidotSpaceAdventureObjectName.START: {
                this.load_scene(TobidotSpaceAdventureSceneName.PROLOG_MOVIE);
                break;
            }
            case TobidotSpaceAdventureObjectName.CABIN_TERMINAL: {
                const has_password = this.check_progress(
                    [TobidotSpaceAdventureProgressFlag.CABIN_ACT_TERMINAL_FOUND_PASSWORD],
                    []
                );
                if (has_password) {
                    this.set_progress(TobidotSpaceAdventureProgressFlag.CABIN_ACT_DOOR_OPEN);
                    this.text('It shows 2 Messages in the inbox')
                        .then(() => this.text('I will load them to my uPad'))
                        .then(() => this.add_message(TobidotSpaceAdventureMessageName.MAIL_VIVIAN_BREAKUP))
                        .then(() => this.add_message(TobidotSpaceAdventureMessageName.MAIL_SYSTEM_EMERGENCY))
                        .then(() => this.show_tablet_home())
                        ;
                } else {
                    (async () => {
                        await this.text('Password required!');
                        await this.text('Was is "Egg6"? ... No "Flour7" ...');
                        await this.text('Arrgh i forgot my password!');
                        this.set_progress(TobidotSpaceAdventureProgressFlag.CABIN_ACT_TERMINAL_LOOKING_FOR_PASSWORD);
                    })();
                }
                break;
            }
            case TobidotSpaceAdventureObjectName.CABIN_DOOR: {
                if (this.check_progress(
                    [TobidotSpaceAdventureProgressFlag.CABIN_ACT_DOOR_OPEN],
                    [],
                )) {
                    this.load_scene(TobidotSpaceAdventureSceneName.DEMO);
                } else {
                    this.text_multi([
                        "The door is locked.",
                        "I can unlock them from the terminal",
                    ]);
                }
                break;
            }
            case TobidotSpaceAdventureObjectName.BACK_TO_MAIN: {
                this.load_scene(TobidotSpaceAdventureSceneName.MAIN);
                break;
            }
            case TobidotSpaceAdventureObjectName.CABIN_BOTTLE_1: {
                this.text('Errgh! I have had enough alcohol yesterday.');
                break;
            }
            case TobidotSpaceAdventureObjectName.CABIN_BOTTLE_2: {
                (async () => {
                    await this.text('Ouhh, it still has a drop ...');
                    await this.text('Wait no, i\'d better not start again.');
                })();
                break;
            }
            case TobidotSpaceAdventureObjectName.CABIN_BOTTLE_GROUP: {
                this.text('Whiskey, Rum, Beer ... I sure was not picky yesterday.');
                break;
            }
            case TobidotSpaceAdventureObjectName.CABIN_BED: {
                this.text('Comfy, if you enjoy the scent of ooze and mild regret.');
                break;
            }
            case TobidotSpaceAdventureObjectName.CABIN_AIR_CONDITIONER: {
                this.text('I am so glad the air conditioner was fixed last week.');
                break;
            }
            case TobidotSpaceAdventureObjectName.CABIN_JACKET: {
                const is_searching_password = this.check_progress(
                    [TobidotSpaceAdventureProgressFlag.CABIN_ACT_TERMINAL_LOOKING_FOR_PASSWORD],
                    [TobidotSpaceAdventureProgressFlag.CABIN_ACT_TERMINAL_FOUND_PASSWORD],
                );
                if (is_searching_password) {
                    (async () => {
                        await this.text('Oh Right ...', 3000);
                        await this.text('I had a note with my password in my pocket.');
                        await this.text('It\'s: "Spaghetti42" .');
                        this.set_progress(TobidotSpaceAdventureProgressFlag.CABIN_ACT_TERMINAL_FOUND_PASSWORD);
                    })()
                } else {
                    this.text('My favourite Jacket. It makes me look handsome.');
                }
                break;
            }
            case TobidotSpaceAdventureObjectName.TABLET_HOME: {
                this.show_tablet_home();
                break;
            }
            case TobidotSpaceAdventureObjectName.TABLET_CLOSE: {
                this.close_tablet();
                break;
            }
            default: {
                console.error("Unkown object: " + name);
                assert_never(name);
            }
        }
    }

    public open_tablet() {
        this.parent.refs.$tablet.dataset.state = TobidotSpaceAdventureTabletState.HOME;
    }

    public close_tablet() {
        this.parent.refs.$tablet.dataset.state = TobidotSpaceAdventureTabletState.CLOSED;
    }

    public show_tablet_home() {
        this.parent.refs.$tablet.dataset.state = TobidotSpaceAdventureTabletState.HOME;
    }

    public add_message(
        name: TobidotSpaceAdventureMessageName
    ) {
        const $message = this.parent.refs.$messages[name];
        if (!($message instanceof HTMLElement)) {
            throw new Error('Message not found: ' + name);
        }
        const $messages = this.parent.refs.$tablet_message_list;
        const $exist = $messages.querySelector(`[data-name="${name}"]`);
        if ($exist) {
            return;
        }
        const $clone = $message.cloneNode(true);
        // const $title = get_element_by_class_name($messages, 'tablet__messages-title');
        $messages.appendChild($clone);
    }

    public show_message(
        name: TobidotSpaceAdventureMessageName
    ) {
        const $message = this.parent.refs.$messages[name];
        if (!($message instanceof HTMLElement)) {
            throw new Error('Message not found: ' + name);
        }
        this.parent.refs.$tablet_screen.innerHTML = $message.outerHTML;
        this.parent.refs.$tablet.dataset.state = TobidotSpaceAdventureTabletState.MESSAGE;
        this.parent.props.message_flags.set(name, true);
        const progress_flag_name = 'MESSAGE_' + name.replaceAll('-', '_').toUpperCase();
        const progress_flag = (progress_flag_name in TobidotSpaceAdventureProgressFlag)
            /** @ts-ignore */
            ? TobidotSpaceAdventureProgressFlag[progress_flag_name]
            : null;
        if (progress_flag !== null) {
            this.set_progress(progress_flag);
            console.log(this.check_progress([TobidotSpaceAdventureProgressFlag.MESSAGE_MAIL_SYSTEM_EMERGENCY], []));
        }
    }

    public set_progress(
        flag: TobidotSpaceAdventureProgressFlag
    ) {
        this.parent.props.progress_flags.set(flag, true);
    }

    public check_progress(
        required: Array<TobidotSpaceAdventureProgressFlag>,
        prevent_when: Array<TobidotSpaceAdventureProgressFlag>,
    ): boolean {
        const meets_requirements = required.reduce(
            (result: boolean, flag: TobidotSpaceAdventureProgressFlag) => result && (this.parent.props.progress_flags.get(flag) ?? false),
            true
        );
        const is_prevented = prevent_when.reduce(
            (result: boolean, flag: TobidotSpaceAdventureProgressFlag) => result || (this.parent.props.progress_flags.get(flag) ?? false),
            false
        );
        return meets_requirements && !is_prevented;
    }

}

class Properties {
    public mode_print_polygon: boolean = false;
    public $printing_polygon: SVGPathElement | null = null
    public trigger_skip_movie_frame: null | (() => void) = null;
    public $current_scene: HTMLElement | null = null;
    //
    public progress_flags: Map<TobidotSpaceAdventureProgressFlag, boolean> = new Map();
    public message_flags: Map<TobidotSpaceAdventureMessageName, boolean> = new Map();
    public progress_terminal_mail_index: number = 0;

    constructor(
        protected parent: TobidotSpaceAdventure
    ) {
    }
}

class Components {
    constructor(
        protected parent: TobidotSpaceAdventure
    ) {
    }
}

class Listeners {
    protected animation_frame_handle: number | null = null;

    constructor(
        protected parent: TobidotSpaceAdventure
    ) {
        observe_applet_settings_change(
            [],
            this.parent,
            References,
        );
        this.attach();
    }

    public detach() {
        // Detach event listeners and observers, before rerendering the applet
        if (this.animation_frame_handle !== null) {
            cancelAnimationFrame(this.animation_frame_handle);
        }
        this.parent.refs.$view.removeEventListener('click', this.on_view_click);
        window.removeEventListener('keypress', this.on_key_press);

        const $window = this.parent.parentElement;
        $window?.removeEventListener('tbdt.window.resize', this.on_window_resize);
    }

    public attach() {
        if (!this.animation_frame_handle) {
            requestAnimationFrame(this.on_animation_frame);
            this.animation_frame_handle = null;
        }

        window.addEventListener('keypress', this.on_key_press);
        this.parent.refs.$buttons.forEach(($button: HTMLButtonElement) => {
            $button.addEventListener('click', this.on_button_click);
        })
        this.parent.refs.$clickboxes.forEach(($clickbox: SVGElement) => {
            $clickbox.addEventListener('click', this.on_clickbox_click);
        })
        this.parent.refs.$view.addEventListener('click', this.on_view_click);
        this.parent.refs.$tablet.addEventListener('click', this.on_tablet_click);

        const $window = this.parent.parentElement;
        $window?.addEventListener('tbdt.window.resize', this.on_window_resize);
    }

    protected on_tablet_click = (event: Event) => {
        const $tablet = this.parent.refs.$tablet;
        const state = $tablet.dataset.state;
        if (state === TobidotSpaceAdventureTabletState.CLOSED) {
            this.parent.logic.open_tablet();
        } else if (state === TobidotSpaceAdventureTabletState.HOME) {
            const $target = event.target;
            if ($target instanceof HTMLElement) {
                const $message = $target.closest('.tablet__message');
                if ($message instanceof HTMLElement) {
                    const name = $message?.dataset?.name ?? '';
                    if (this.parent.logic.is_message_name(name)) {
                        this.parent.logic.show_message(name);
                    }
                }
            }
        }
        event.stopPropagation();
    }

    protected on_window_resize = (event: TobidotWindowResizeEvent) => {
        this.parent.logic.refresh_view_scale();
    }

    protected on_key_press = (event: KeyboardEvent) => {
        switch (event.key) {
            case '1':
                this.parent.props.mode_print_polygon = !this.parent.props.mode_print_polygon;
                if (this.parent.props.$printing_polygon) {
                    this.parent.props.$printing_polygon = null;
                }
                break;
        }
    }

    protected on_clickbox_click = (event: Event) => {
        if (this.parent.props.trigger_skip_movie_frame) {
            // this.parent.props.trigger_skip_movie_frame();
            // event.
            return;
        }
        if (this.parent.props.mode_print_polygon) {
            return;
        }
        const $target = event.target;
        if ($target instanceof SVGElement) {
            const $clickbox = $target.closest('svg');
            if ($clickbox) {
                const name = $clickbox.dataset.name;
                if (name) {
                    this.parent.logic.action_use(name);
                    event.stopPropagation();
                }
            }
        }
    }

    protected on_view_click = (event: MouseEvent) => {
        if (this.parent.props.mode_print_polygon && this.parent.props.$current_scene) {
            //
            const view_bounds = this.parent.refs.$view.getBoundingClientRect();
            const x = event.clientX - view_bounds.left;
            const y = event.clientY - view_bounds.top;
            const fx = Math.round(x * 400 / view_bounds.width);
            const fy = Math.round(y * 300 / view_bounds.height);
            //
            if (this.parent.props.$printing_polygon === null) {
                const $svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                $svg.classList = 'clickbox';
                $svg.dataset.name = 'dummy';
                $svg.setAttribute('viewBox', '0 0 400 300');
                $svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                const $path = this.parent.props.$printing_polygon = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                $path.classList = 'clickbox__path';
                $path.setAttribute('d', `M ${fx},${fy} z`);
                $svg.appendChild($path);
                this.parent.props.$current_scene.appendChild($svg);
            } else {
                const $path = this.parent.props.$printing_polygon;
                const d = $path.getAttribute('d') ?? '';
                const parts = d.split(' ').slice(0, -1);
                parts.push(`L ${fx},${fy} z`);
                $path.setAttribute('d', parts.join(' '));
            }
        }
        if (this.parent.props.trigger_skip_movie_frame) {
            this.parent.props.trigger_skip_movie_frame();
        }
    }

    protected on_button_click = (event: Event) => {
        const target = event.target;
        if (target instanceof HTMLElement) {
            const button = target.closest('button');
            if (button instanceof HTMLButtonElement) {
                const name = button.name;
                this.parent.logic.action_use(name);
                event.stopPropagation();
            }
        }
    }

    protected on_animation_frame = () => {
        this.parent.logic.update();

        requestAnimationFrame(this.on_animation_frame);
    }
}
