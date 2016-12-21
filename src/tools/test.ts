import { InfernoChildren, VNode } from '../core/structures';
import { throwError, toArray } from '../shared';

import ShallowRenderer from './shallowRenderer';
import createElement from '../factories/createElement';
import isValidElement from '../factories/isValidElement';
import { render } from '../DOM/rendering';

export function isElement(element: VNode): boolean {
	return isValidElement(element);
};

export function renderIntoDocument(element: VNode): InfernoChildren {
	const div = document.createElement('div');
	return render(element, div);
}

export function isElementOfType(inst: VNode, componentClass: Function): boolean {
	return (
		isValidElement(inst) &&
		inst.type === componentClass
	);
};

export function isDOMComponent(inst: any): boolean  {
	return !!(inst && inst.nodeType === 1 && inst.tagName);
}

export function isDOMComponentElement(inst: VNode): boolean {
	return !!(inst &&
		isValidElement(inst) &&
		typeof inst.type === 'string'
	);
};

export function isCompositeComponent(inst): boolean {
	if (isDOMComponent(inst)) {
		return false;
	}
	return (
		inst != null &&
		typeof inst.type.render === 'function' &&
		typeof inst.type.setState === 'function'
	);
};

export function isCompositeComponentWithType(inst, type: Function): boolean {
	if (!isCompositeComponent(inst)) {
		return false;
	}
	return (inst.type === type);
}

function findAllInTree(inst: any, test: Function): VNode[] {
	if (!inst) {
		return [];
	}
	const publicInstance = inst.dom;
	let ret = test(publicInstance) ? [publicInstance] : [];
	const currentElement = inst._vNode;
	if (isDOMComponent(publicInstance)) {
		const renderedChildren = inst.props && inst.props.children;
		for (let key in renderedChildren) {
      if (!renderedChildren.hasOwnProperty(key)) {
        continue;
      }
      ret = ret.concat(
        findAllInTree(
          renderedChildren[key],
          test
        )
      );
    }
	} else if (
		isValidElement(currentElement) &&
		typeof currentElement.type === 'function'
	) {
		ret = ret.concat(
      findAllInTree(currentElement, test)
    );
	}
	return ret;
}

export function findAllInRenderedTree(inst: any, test: Function): VNode[] {
	const result: VNode[] = [];
	if (!inst) {
		return result;
	}
	if (isDOMComponent(inst)) {
		throwError('findAllInRenderedTree(...): instance must be a composite component');
	}
	return findAllInTree(inst, test);
}

type stringArr = string | string[];
export function scryRenderedDOMComponentsWithClass(root: VNode, classNames: stringArr): VNode[] {
	return findAllInRenderedTree(root, function(inst) {
		if (isDOMComponent(inst)) {
			let className = inst.className;
			if (typeof className !== 'string') {
				// SVG, probably.
				className = inst.getAttribute('class') || '';
			}
			const classList = className.split(/\s+/);

			const classNamesList = toArray(classNames);
			return classNamesList.every(function(name) {
				return classList.indexOf(name) !== -1;
			});
		}
		return false;
	});
}

export function scryRenderedDOMComponentsWithTag (root: VNode, tagName: string): VNode[] {
	return findAllInRenderedTree(root, function(inst) {
		return isDOMComponent(inst) && inst.tagName.toUpperCase() === tagName.toUpperCase();
	});
}

export function scryRenderedComponentsWithType (root: VNode, componentType: Function): VNode[] {
	return findAllInRenderedTree(root, function(inst) {
		return isCompositeComponentWithType(
			inst,
			componentType
		);
	});
}

function findOneOf(root: VNode, option: any, optionName: string, finderFn: Function): VNode {
	const all = finderFn(root, option);
	if (all.length > 1) {
		throwError(`Did not find exactly one match (found ${all.length}) for ${optionName}: ${option}`);
	}
	return all[0];
}

export function findRenderedDOMComponentsWithClass(root: VNode, classNames: Function): VNode {
	return findOneOf(root, classNames, 'class', scryRenderedDOMComponentsWithClass);
}

export function findenderedDOMComponentsWithTag(root: VNode, tagName: Function): VNode {
	return findOneOf(root, tagName, 'tag', scryRenderedDOMComponentsWithTag);
}

export function findRenderedComponentWithType(root: VNode, componentClass: Function): VNode {
	return findOneOf(root, componentClass, 'component', scryRenderedComponentsWithType);
}

export function mockComponent(module, mockTagName: string) {
	mockTagName = mockTagName || typeof module.type === 'string' ? module.type : 'div';

	module.prototype.render.mockImplementation(function() {
		return createElement(
			mockTagName,
			null,
			this.props.children
		);
	});

	return this;
}

export function createRenderer(): ShallowRenderer {
	return new ShallowRenderer();
}
