import React from 'react';
import { Breadcrumb as BootstrapBreadcrumb } from 'react-bootstrap';

function FileBreadcrumb({ path, onNavigate }) {
    const pathSegments = path ? path.split('/') : [];

    return (
        <BootstrapBreadcrumb listProps={{ className: 'mb-0' }}>
            <BootstrapBreadcrumb.Item onClick={() => onNavigate('')} active={!path}>
                🏠 Home
            </BootstrapBreadcrumb.Item>
            {pathSegments.map((segment, index) => {
                const currentPath = pathSegments.slice(0, index + 1).join('/');
                const isLast = index === pathSegments.length - 1;
                return (
                    <BootstrapBreadcrumb.Item 
                        key={index}
                        onClick={() => !isLast && onNavigate(currentPath)}
                        active={isLast}
                        href={isLast ? undefined : '#'}
                    >
                        {segment}
                    </BootstrapBreadcrumb.Item>
                );
            })}
        </BootstrapBreadcrumb>
    );
}

export default FileBreadcrumb;