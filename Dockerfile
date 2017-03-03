FROM ubuntu:14.04

# Install from jp
# RUN sed -e 's;http://archive;http://jp.archive;' -e  's;http://us\.archive;http://jp.archive;' -i /etc/apt/sources.list

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update && apt-get -y upgrade \
 && apt-get install -y make git build-essential gcc g++ patch libssl-dev unzip libwww-perl libdatetime-perl curl xvfb libexif12 gconf2

# gpg keys listed at https://github.com/nodejs/docker-node/blob/master/6.2/Dockerfile
RUN set -ex \
  && for key in \
    9554F04D7259F04124DE6B476D5A82AC7E37093B \
    94AE36675C464D64BAFA68DD7434390BDBE9B9C5 \
    0034A06D9D9B0064CE8ADF6BF1747F4AD2306D93 \
    FD3A5288F042B6850C66B31F09FE44734EB7990E \
    71DCFD284A79C3B38668286BC97EC7A07EDE3FC1 \
    DD8F2338BAE7501E3DD5AC78C273792F7D83545D \
    B9AE9905FFD7803F25714661B63B535A4C206CA9 \
    C4F0DFFF4E8C1A8236409D08E73BC641CC11F4C8 \
  ; do \
    gpg --keyserver ha.pool.sks-keyservers.net --recv-keys "$key"; \
  done

ENV DISPLAY=:99
ENV SCREEN_DIMENSION=1024x768x24
ENV NPM_CONFIG_LOGLEVEL info
ENV NVM_DIR /usr/local/ap/.nvm
ENV NODE_VERSION 7.6.0
ENV COVERALLS_REPO_TOKEN=5CXu3ZU0E5Wb020kUivJNPih58Mt6NMaj

RUN git clone git://github.com/creationix/nvm.git $NVM_DIR
RUN /bin/bash -c "source $NVM_DIR/nvm.sh && nvm install v$NODE_VERSION"

RUN curl -sSL https://dl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list \
  && apt-get update && apt-get install -qqy google-chrome-stable

ENV PYTHON_VERSION 3.5.0
ENV AP_DIR /usr/local/ap

RUN curl -SLO "https://www.python.org/ftp/python/$PYTHON_VERSION/Python-$PYTHON_VERSION.tar.xz" \
  && tar Jxvf Python-$PYTHON_VERSION.tar.xz \
  && cd Python-$PYTHON_VERSION && ./configure --prefix="$AP_DIR/python3" --enable-shared && make && make install

RUN echo "$AP_DIR/python3/lib" > /etc/ld.so.conf.d/python3.conf \
  && ldconfig

ENV VIRTUALENV_BASE_DIR /usr/local/ap/venv

RUN mkdir -p $VIRTUALENV_BASE_DIR \
  && $AP_DIR/python3/bin/pyvenv $VIRTUALENV_BASE_DIR/circus \
  && $VIRTUALENV_BASE_DIR/circus/bin/python -m ensurepip --upgrade \
  && $VIRTUALENV_BASE_DIR/circus/bin/pip install --upgrade pip \
  && $VIRTUALENV_BASE_DIR/circus/bin/pip install circus

RUN mkdir -p /var/log/margaux
RUN mkdir -p /usr/local/ap/margaux
WORKDIR /usr/local/ap/margaux

ADD package.json /usr/local/ap/margaux/
RUN /bin/bash -c "source $NVM_DIR/nvm.sh && npm install"
ADD . /usr/local/ap/margaux/

RUN mkdir /usr/src/google-chrome9220 /usr/src/google-chrome9221 /usr/src/google-chrome9222 /usr/src/google-chrome9223 /usr/src/google-chrome9224 /usr/src/google-chrome9225

# ENV XDG_GLOBAL_DIR /usr/share/desktop-directories

# RUN mkdir -p $XDG_GLOBAL_DIR

ADD env/margaux.sh /usr/local/ap/margaux/bin/
RUN chmod 755 /usr/local/ap/margaux/bin/margaux.sh
ADD env/etc/circus.ini /etc/
ADD env/etc/circusd.conf /etc/init/

ENV NODE_PATH $NVM_DIR/versions/node/v$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH
