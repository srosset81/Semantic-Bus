FROM codeception/codeceptjs
RUN apt-get update -q && apt-get install -yq curl --no-install-recommends && rm -rf /var/lib/apt/lists/*
ADD . .
RUN ls
CMD ["codeceptjs", "run", "--grep", "@local", "--debug"]
