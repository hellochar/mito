import React, { useState } from "react";
import styled from "styled-components";

interface ExpandProps {
	children: React.ReactNode;
	shrunkElements: React.ReactNode;
}

const ExpandButton = styled.div`
	cursor: pointer;
	position: relative;
	border-bottom: 1px solid black;
	margin: 20px 0;
	display: flex;
`;

const ExpandCaret = styled.div`
	margin-left: auto;
`;

function Expand({ children, shrunkElements }: ExpandProps) {
	const [expanded, setExpanded] = useState(false);

	const handleExpandClick = () => {
		setExpanded(!expanded);
	};

	return (
		<div>
			<ExpandButton onClick={handleExpandClick}>
				{shrunkElements}
				{expanded ? <ExpandCaret>▼</ExpandCaret> : <ExpandCaret>▶</ExpandCaret>}
			</ExpandButton>
			{expanded ? <div>{children}</div> : null}
		</div>
	);
}

export default Expand;
