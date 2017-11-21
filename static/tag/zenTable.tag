<zenTable class="containerV {opts.zentableClass}">
  <div class="containerH tableHeader" ref="tableHeader">
    <yield from="header"/>
  </div>
  <div class="containerV scrollable tableBody" ref="tableBodyContainer" ondragover={on_drag_over} ondrop={on_drop}>
    <!--<div class="table scrollable" name="tableBody" ref="tableBody" ondragover={on_drag_over} ondrop={on_drop}>-->
    <div
      class="tableRow containerH {selected:selected} {mainSelected:mainSelected}"
      dragenter={drag_enter}
      dragleave={drag_leave}
      draggable={opts.drag}
      data-rowid={rowid}
      data-id={_id}
      each={indexedData}
      ondragend={parent.drag_end}
      ondragstart={parent.drag_start}
      onclick={rowClic}
      style="justify-content: space-between;flex-shrink:0;">

      <div class="containerH tableRowContent" style="flex-grow:1;" onkeyup={rowKeyUp}>
        <yield from="row"/>
      </div>
      <div class="containerV" style="flex-basis:60px;justify-content:center">
        <div class="containerH">
          <div onclick={delRowClick} data-rowid={rowid} if={!(opts.disallowdelete==true)} style="flex-basis:30px;">
            <img class="commandButtonImage" src="./image/poubelle.png" height="20px" draggable={false}>
          </div>
          <div onclick={navigationClick} if={!(opts.disallownavigation==true)} data-rowid={rowid} style="flex-basis:30px;">
            <img class="commandButtonImage" src="./image/edit.png" height="20px" draggable={false}>
          </div>
        </div>
      </div>
    </div>

    <!--</div>-->
  </div>
  <script>

    this.Id = null

    drag_leave(e) {
      this.Id = e.item
    }

    drag_enter(e) {
      e.target.parentNode.parentNode.insertBefore(this.placeholder, e.target.parentNode);
    }

    on_drag_over(e) {
      // return true; para no aceptar

    }

    drag_end(event) {
      this.placeholder.remove();
      this.innerData.splice(this.dragged.item.rowid, 1);
      this.innerData.splice(this.Id.rowid, 0, this.dragged.item);
      RiotControl.trigger('workspace_list_persist', this.dragged.item)
      this.update();
    }

    rowClic(e) {
      //console.log("in row click", this.innerData)
      if (!(this.opts.disallowselect == true)) {
        var index = parseInt(e.item.rowid)
        if (this.innerData.length > 0) {
          if (!e.ctrlKey) {
            for (data of this.innerData) {
              data.selected = false;
              data.mainSelected = false;
            }
            this.innerData[index].mainSelected = true;
            let dataWithRowId = this.innerData[index];
            dataWithRowId.rowId = index;
            this.trigger('rowSelect', dataWithRowId)
          }
          var selected = this.innerData[index].selected || false;
          this.innerData[index].selected = !selected;
        }
      }
    }

    drag_start(event) {
      this.dragged = event;
      return true;
    }

    var arrayChangeHandler = {
      tag: this,
      get: function (target, property, third, fourth) {
        switch (property) {
          case 'push':
          case 'unshift':
            return function (data) {
              target[property](data);
              console.log('update')
              this.tag.update();
            }.bind(this);
            break;
          default:
            return target[property];
        }
      },
      set: function (target, property, value, receiver) {
        //console.log('setting ' + property + ' for ' + target + ' with value ' + value);
        target[property] = value;
        // you have to return true to accept the changes
        return true;
      }
    };

    //  this.innerData = new Proxy([], arrayChangeHandler);

    this.innerData = [];
    this.background = ""
    //arrayChangeHandler.tag=this;
    Object.defineProperty(this, 'data', {
      set: function (data) {
        //this.innerData=new Proxy(data, arrayChangeHandler);
        this.innerData = data;
        this.update();
        //this.reportCss(); this.reportFlex(); console.log(this.items,data);
      }.bind(this),
      get: function () {
        return this.innerData;
      },
      configurable: true
    });

    Object.defineProperty(this, 'indexedData', {
      get: function () {
        var recordId = 0;
        for (record of this.innerData) {
          record.rowid = recordId++;
          record.opts = this.opts;
        }
        return this.innerData;
      }.bind(this),
      configurable: true
    });

    navigationClick(e) {
      console.log("test", e.item)
      var index = parseInt(e.item.rowid);
      let dataWithRowId = this.innerData[index];
      dataWithRowId.rowId = index;
      console.log(dataWithRowId)
      this.trigger('rowNavigation', dataWithRowId)
    }

    addRowClick(e) {
      //var index=parseInt(e.currentTarget.dataset.rowid) console.log(index);
      this.trigger('addRow')
    }

    delRowClick(e) {
      //let dataWithRowId = e.item;
      this.trigger('delRow', e.item)
      //dataWithRowId.rowId = i;
      //this.trigger('delRow', e.item)
      // console.log('ALLO');
      // let i = 0;
      // for (data of this.innerData) {
      //   if (data.selected) {
      //     console.log("in del row scrapper", data)
      //     let dataWithRowId = data;
      //     dataWithRowId.rowId = i;
      //     this.trigger('delRow', data)
      //   }
      //   i++
      // }
    }

    cancelClick(e) {
      for (data of this.innerData) {
        data.selected = false;
      }
      this.trigger('cancel');
    }
    actionClick(e) {
      let i = 0;
      let selectedData = [];

      for (data of this.innerData) {
        if (data.selected) {
          let dataWithRowId = data;
          dataWithRowId.rowId = i;
          selectedData.push(data);
        }
        i++
      }
      this.trigger('action', selectedData);
    }

    rowKeyUp(e) {
      console.log('KEY PRESS', e);
      if (e.target.attributes['data-field'] != undefined) {
        console.log('ALLO');
        e.item[e.target.attributes['data-field'].value] = e.target.value;
      }
      console.log(this.indexedData);
    }

    recalculateHeader() {
      //console.log(this.refs.tableHeader)
      var headers = this.refs.tableHeader.children;
      for (var row of this.root.querySelectorAll('.tableRow')) {
        for (var headerkey in headers) {
          var numkey = parseInt(headerkey);
          if (!isNaN(numkey)) {
            //console.log(row.children[numkey].getBoundingClientRect().width);
            var width = row.children[numkey].getBoundingClientRect().width;
            var cssWidth = width + 'px';
            headers[headerkey].style.width = cssWidth;
            headers[headerkey].style.maxWidth = cssWidth;
            headers[headerkey].style.minWidth = cssWidth;
            headers[headerkey].style.flexBasis = cssWidth;
            //console.log(headers[headerkey].style);
          }
        }
        break;
      }
    }

    this.on('mount', function () {
      this.placeholder = document.createElement("div");
      this.placeholder.className = "placeholder";
      // this.reportCss(); addResizeListener(this.refs.tableBody, function () {   //this.recalculateHeader() }.bind(this)); this.refs.tableBodyContainer.addEventListener('scroll', function (e) {   //console.log(this.tableBodyContainer.scrollLeft);
      // this.refs.tableHeader.scrollLeft = this.refs.tableBodyContainer.scrollLeft; }.bind(this));

    });
  </script>
  <style>

    [draggable] {
      -moz-user-select: none;
      -khtml-user-select: none;
      -webkit-user-select: none;
      user-select: none;
      /* Required to make elements draggable in old WebKit */
      -khtml-user-drag: element;
      -webkit-user-drag: element;
    }
    .tableBody {
      background-color: rgb(238,242,249);
    }

    .commandBarTable {
      color: #3883fa;
      background-color: white;
    }

    .tableHeader {
      color: rgb(110,110,110);
      background-color: rgb(238,242,249);
      justify-content: start;
    }

    .placeholder {
      margin: 4px 4px 4px 10px;
      border-width: 2px;
      border-style: solid;
      border-radius: 4px;
      border-color: #3883fa;
    }

    .tableRow {
      background-color: rgb(248,252,256);
      margin-top: 9pt;
      border-radius: 10px;
      padding: 8pt;
      color: rgb(110,110,110);
    }
    .tableRowContent {
      justify-content: start;
    }
    .tableHeader > * {
      /*display: inline-block;*/
      padding: 10px;
      border-width: 1px;
    }
    .tableHeader > *:last-child {
      border-right-style: none;
    }
    .tableRow > *:last-child {
      border-right-style: none;
    }

    .selected {
      border-color: blue;
    }

  </style>

</zenTable>
