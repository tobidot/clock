import { Class } from "@game.object/ts-game-toolbox";

export abstract class AppletBaseRenderer<T extends HTMLElement & { logic: { init: () => void } }> {
    public shadow: ShadowRoot;
    public root: HTMLElement;

    constructor(
        protected parent: T,
        protected html: string,
        protected style: string,
    ) {
        this.shadow = this.parent.attachShadow({ mode: 'open' });
        this.shadow.appendChild(this.render_style());
        this.shadow.appendChild(this.root = this.render_content());
        this.apply_settings();
    }

    // This method can be overridden to apply settings to the root element
    public abstract apply_settings(): void;

    public refresh(): HTMLElement {
        this.root.remove();
        this.root = this.render_content();
        this.apply_settings();
        this.shadow.appendChild(this.root);
        return this.root;
    }

    public render_content(): HTMLElement {
        const $root = document.createElement('div');
        $root.id = 'root';
        $root.innerHTML = this.html;
        return $root;
    }

    public render_style(): HTMLElement {
        // If no override_style is provided, use the default CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = this.style;
        link.addEventListener('load', (event: Event) => this.after_style_load(event), { once: true });
        return link;
    }

    public after_style_load(event: Event) {
        this.parent.logic.init();
    }
}

export function observe_applet_settings_change<
    ELEMENT,
    REFERENCES,
>(
    attributes: Array<string>,
    $element: ELEMENT & HTMLElement & {
        settings: { load: () => void; },
        renderer: { apply_settings: () => void; },
        listeners: { attach: () => void; detach(): void; },
        refs: REFERENCES,
    },
    references_class: Class<REFERENCES>,
): MutationObserver {
    const observer = new MutationObserver((mutations: Array<MutationRecord>) => {
        // Element has been updated, reinitialize settings and references
        load_applet($element, references_class);
    });
    observer.observe($element, {
        attributes: true,
        attributeFilter: attributes,
    });
    return observer;
}

export function load_applet<
    ELEMENT,
    REFERENCES,
>(
    $element: ELEMENT & HTMLElement & {
        settings: { load: () => void; },
        renderer: { apply_settings: () => void; },
        listeners: { attach: () => void; detach(): void; },
        refs: REFERENCES,
    },
    references_class: Class<REFERENCES>,
) {
    $element.listeners.detach();
    $element.settings.load();
    $element.renderer.apply_settings();
    $element.refs = new references_class($element);
    $element.listeners.attach();

}